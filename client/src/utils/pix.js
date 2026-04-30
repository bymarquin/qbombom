export function generatePixPayload(pixKey, pixType, merchantName, merchantCity, amount, _transactionId = 'PIX') {
  function crc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  const formatField = (id, value) => {
    const valStr = String(value);
    const length = String(valStr.length).padStart(2, '0');
    return `${id}${length}${valStr}`;
  };

  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");
  };

  // Formatação OFICIAL do BACEN baseada no Tipo
  let cleanKey = String(pixKey).trim();
  
  if (pixType === 'cpf' || pixType === 'cnpj') {
    // CNPJ e CPF precisam ser EXATAMENTE apenas os números
    cleanKey = cleanKey.replace(/\D/g, '');
  } else if (pixType === 'phone') {
    // Telefone precisa ser apenas números, porém SEMPRE começando com +55
    let numOnly = cleanKey.replace(/\D/g, '');
    if (numOnly.length === 10 || numOnly.length === 11) {
      cleanKey = `+55${numOnly}`;
    } else {
      cleanKey = `+${numOnly}`; // Adiciona o + na frente de tudo que sobrar
    }
  } else if (pixType === 'email') {
    // Email não muda muito, só garante sem espaços em branco
    cleanKey = cleanKey.replace(/\s/g, '');
  } else if (pixType === 'random') {
    // Chave aleatória (UUID) precisa manter os hífens
    cleanKey = cleanKey.replace(/\s/g, '');
  }

  // Para PIX estático funcionar em 100% dos bancos (especialmente Gateway PIX e Itaú),
  // o TXID deve ser obrigatoriamente '***' (que significa gerado pelo aplicativo do usuário).
  const cleanTxid = '***';

  const formattedAmount = Number(amount).toFixed(2);
  const gui = formatField('00', 'br.gov.bcb.pix') + formatField('01', cleanKey);
  const cleanName = removeAccents(merchantName).substring(0, 25) || 'Loja';
  const cleanCity = removeAccents(merchantCity).substring(0, 15) || 'Cidade';

  const payload = [
    formatField('00', '01'), 
    formatField('26', gui),  
    formatField('52', '0000'), 
    formatField('53', '986'), 
    formatField('54', formattedAmount), 
    formatField('58', 'BR'), 
    formatField('59', cleanName), 
    formatField('60', cleanCity), 
    formatField('62', formatField('05', cleanTxid)), 
    '6304' 
  ].join('');

  return payload + crc16(payload);
}
