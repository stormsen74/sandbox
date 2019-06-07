class AppLauncher {
  start(complete) {
    this.completed = false;

    const checkFunction = () => {
      const cssCompleteFlag = window.getComputedStyle(document.querySelector('body'), ':after').getPropertyValue('content');
      if (cssCompleteFlag !== '' && cssCompleteFlag !== 'none') {
        this.completed = true;
        complete();
      }
    };

    checkFunction();

    if (!this.completed) {
      const iv = setInterval(() => {
        checkFunction();
        if (this.completed) {
          clearInterval(iv);
        }
      }, 0);

      setTimeout(() => {
        if (!this.completed) {
          console.warn('Timeout reached, App should have started but CSS body:after was not found!');
        }
      }, 500);
    }
  }
}

export default AppLauncher;
