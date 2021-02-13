import App from './app';

new App().init();

if (module.hot) {
  console.log('hot');
  module.hot.accept('./app', () => { new App().init(); });
}
