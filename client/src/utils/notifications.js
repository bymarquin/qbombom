export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Erro ao pedir permissão de notificação', error);
    return false;
  }
};

export const showNotification = (title, options = {}) => {
  // Apenas tentar exibir se tiver permissão e a janela não estiver em foco
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  try {
    // Para não incomodar se o cara já tá com o app aberto na cara dele
    if (document.visibilityState === 'visible') return;

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      vibrate: [200, 100, 200], // vibra em androids suportados
      ...options
    });
    
    // Foca a aba do app se a pessoa clicar na notificação
    notification.onclick = function() {
      window.focus();
      this.close();
    };
  } catch (error) {
    console.error('Erro ao mostrar notificação', error);
  }
};
