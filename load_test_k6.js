import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';


const config = {
    Yandex: {
      baseUrl: 'http://ya.ru',
      maxRpm: 60
    },
    WWW: {
      baseUrl: 'http://www.ru',
      maxRpm: 120
    }
  }

export const options = {
  scenarios: {
      yandex: {
        executor: 'ramping-vus',
        exec: 'Yandex',
        startVUs: 0,
        stages: [
            {duration: '5m', target: config.Yandex.maxRpm},
            {duration: '10m', target: config.Yandex.maxRpm},
            {duration: '5m', target: (config.Yandex.maxRpm*1.2).toFixed(0)},
            {duration: '10m', target: (config.Yandex.maxRpm*1.2).toFixed(0)}
          ]
      },
      www: {
        executor: 'ramping-vus',
        exec: 'WWW',
        startVUs: 0,
          stages: [
            {duration: '5m', target: config.WWW.maxRpm},
            {duration: '10m', target: config.WWW.maxRpm},
            {duration: '5m', target: (config.WWW.maxRpm*1.2).toFixed(0)},
            {duration: '10m', target: (config.WWW.maxRpm*1.2).toFixed(0)}
            ]
      }
},
thresholds: {
    http_req_failed: ['rate < 0.01'],
    http_req_duration: ['p(95) < 200']
  }};

export function Yandex() {
  const res = http.get(config.Yandex.baseUrl);
  check(res, {
    'status code is 200': (res) => res.status === 200
  });

}

export function WWW() {
  const res = http.get(config.WWW.baseUrl);
  check(res, {
    'status code is 200': (res) => res.status === 200
  });

}
