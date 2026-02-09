# 운영 서버 산출물

## 운영 서버 구조
- 서버: i14a705.p.ssafy.io
- 경로: /opt/unblur/infra
- 구성: docker-compose 기반으로 BE/FE, DB, MinIO, Kurento, 모니터링 스택 운영

## 파일 설명
- docker-compose.yml
  - 운영 서비스 전체 구성(nginx, be, fe, postgres, minio, kurento, 모니터링 등)
- .env
  - 운영 환경 변수 정의
- nginx/nginx.conf
  - 리버스 프록시 및 라우팅 설정
- turnserver/turnserver.conf
  - Coturn 설정(WebRTC TURN/ICE 관련)
- prometheus/prometheus.yml
  - Prometheus 스크래핑 타겟/규칙
- loki/loki.yml
  - Loki 로그 수집 설정
- promtail/promtail.yml
  - Promtail 로그 수집 파이프라인 설정
- grafana-provisioning/
  - Grafana 데이터소스/대시보드 자동 등록 설정
- pgvector-init.sql
  - Postgres 초기화 스크립트(pgvector 확장 설치)
- redeploy.sh
  - 운영 서버 재배포 스크립트(이미지 pull 및 재기동)


## 에러 로그 저장 규칙(운영)
- 경로: /opt/unblur/logs
- 기본 로그 파일: error.log
- 일자별 롤링: error.YYYY-MM-DD.log
- 보관 기간: 30일
- 수집 레벨: WARN 이상
- 설정 파일: BE `src/main/resources/logback-spring.xml`

## 산출물
- logs/error.log, logs/error.YYYY-MM-DD.log
  - 운영 서버 에러 로그(경고 이상 레벨)
  - 산출물에는 logs/ 하위에 보관
