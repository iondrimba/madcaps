import App from './app';

const app = new App().init();

if (module.hot) {
  module.hot.accept('./app', () => {
    app.cleanUp();
    app.init();
  });
}
