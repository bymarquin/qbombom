const path = require('path');
const { uploadFile, deleteFile, listFiles, moveFile, getFile } = require('../services/storageService');

function normalizePrefix(input = '') {
  return String(input)
    .trim()
    .replace(/^\/+/, '')
    .replace(/\.{2,}/g, '')
    .replace(/\/+/g, '/');
}

function sanitizeFileName(fileName = '') {
  const parsed = path.parse(String(fileName).trim());
  const safeBase = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'arquivo';

  const ext = parsed.ext ? parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
  return `${safeBase}${ext}`;
}

function splitNameAndExt(fileName = '') {
  const parsed = path.parse(String(fileName || ''));
  return {
    dir: parsed.dir || '',
    name: parsed.name || 'arquivo',
    ext: parsed.ext || '',
  };
}

async function resolveAvailableKey(initialKey) {
  const { dir, name, ext } = splitNameAndExt(initialKey);
  let attempt = 0;

  while (attempt < 1000) {
    const fileName = attempt === 0 ? `${name}${ext}` : `${name}-${attempt}${ext}`;
    const candidateKey = dir ? `${dir}/${fileName}` : fileName;
    const listed = await listFiles({ prefix: candidateKey, maxKeys: 1 });
    const exists = (listed.files || []).some((file) => file.key === candidateKey);

    if (!exists) return candidateKey;
    attempt += 1;
  }

  const fallback = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fallbackName = `${name}-${fallback}${ext}`;
  return dir ? `${dir}/${fallbackName}` : fallbackName;
}

function parseBase64Payload(fileBase64 = '') {
  const value = String(fileBase64 || '');

  const dataUrlMatch = value.match(/^data:([\w/+.-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      contentType: dataUrlMatch[1],
      buffer: Buffer.from(dataUrlMatch[2], 'base64'),
    };
  }

  return {
    contentType: null,
    buffer: Buffer.from(value, 'base64'),
  };
}

exports.list = async (req, res) => {
  try {
    const prefix = normalizePrefix(req.query.prefix || '');
    const pagination = await listFiles({
      prefix,
      maxKeys: req.query.maxKeys,
      continuationToken: req.query.continuationToken,
    });

    res.json(pagination);
  } catch (error) {
    console.error('[r2 list]', error);
    res.status(500).json({ error: 'Falha ao listar arquivos no R2.' });
  }
};

exports.upload = async (req, res) => {
  try {
    const { fileName, fileBase64, contentType, prefix = 'manual' } = req.body;
    const multipartFile = req.file;

    if (!multipartFile && (!fileName || !fileBase64)) {
      return res.status(400).json({ error: 'Arquivo obrigatorio. Envie multipart (file) ou base64.' });
    }

    const safePrefix = normalizePrefix(prefix);
    const incomingName = multipartFile?.originalname || fileName;
    const safeFileName = sanitizeFileName(incomingName);
    const requestedKey = safePrefix ? `${safePrefix}/${safeFileName}` : safeFileName;
    const key = await resolveAvailableKey(requestedKey);

    let buffer = multipartFile?.buffer;
    let detectedContentType = multipartFile?.mimetype || contentType || 'application/octet-stream';

    if (!multipartFile) {
      const parsed = parseBase64Payload(fileBase64);
      buffer = parsed.buffer;
      detectedContentType = parsed.contentType || detectedContentType;
    }

    const url = await uploadFile(buffer, key, detectedContentType);

    res.status(201).json({
      file: {
        key,
        url,
        size: buffer.length,
        contentType: detectedContentType,
      },
    });
  } catch (error) {
    console.error('[r2 upload]', error);
    res.status(500).json({ error: 'Falha ao enviar arquivo para o R2.' });
  }
};

exports.move = async (req, res) => {
  try {
    const sourceKey = normalizePrefix(req.body?.sourceKey || '');
    const destinationKey = normalizePrefix(req.body?.destinationKey || '');

    if (!sourceKey || !destinationKey) {
      return res.status(400).json({ error: 'sourceKey e destinationKey sao obrigatorias.' });
    }

    if (sourceKey === destinationKey) {
      return res.status(400).json({ error: 'sourceKey e destinationKey nao podem ser iguais.' });
    }

    const moved = await moveFile(sourceKey, destinationKey);
    res.json({ file: moved, message: 'Arquivo movido com sucesso.' });
  } catch (error) {
    console.error('[r2 move]', error);
    res.status(500).json({ error: 'Falha ao mover arquivo no R2.' });
  }
};

exports.proxy = async (req, res) => {
  try {
    const key = normalizePrefix(req.query?.key || '');
    if (!key) {
      return res.status(400).json({ error: 'key e obrigatoria.' });
    }

    const ifNoneMatch = req.headers['if-none-match'];

    let file;
    try {
      file = await getFile(key, { ifNoneMatch });
    } catch (err) {
      if (err.name === 'NotModified' || err.$metadata?.httpStatusCode === 304) {
        return res.status(304).end();
      }
      throw err;
    }

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Cache-Control', file.cacheControl);
    if (file.etag) res.setHeader('ETag', file.etag);
    if (file.contentLength) res.setHeader('Content-Length', file.contentLength);

    file.stream.pipe(res);
  } catch (error) {
    console.error('[r2 proxy]', error);
    res.status(500).json({ error: 'Falha ao carregar arquivo do R2.' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const key = normalizePrefix(req.body?.key || '');
    if (!key) {
      return res.status(400).json({ error: 'key e obrigatoria.' });
    }

    await deleteFile(key);
    res.json({ message: 'Arquivo removido com sucesso.' });
  } catch (error) {
    console.error('[r2 delete]', error);
    res.status(500).json({ error: 'Falha ao remover arquivo do R2.' });
  }
};
