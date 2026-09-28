import { gasService } from './src/services/gasService';
(async () => {
  const res = await gasService.post('getOptions');
  console.log(JSON.stringify(res));
})();
