# 📌 NAS 배포 및 DB 마이그레이션 할 일 (TODO)

## 1. Supabase (클라우드 DB) 세팅
- [ ] [Supabase 홈페이지](https://supabase.com) 접속 및 새 프로젝트 생성 (`fluxx-db` 등)
- [ ] 데이터베이스 비밀번호 안전한 곳에 백업/기록하기
- [ ] **Project Settings > Database > URI** 탭에서 Connection String 주소 복사하기
- [ ] 복사한 주소의 `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 치환하기

## 2. 로컬(Mac) 프로젝트 설정 변경
- [ ] `.env` 파일의 `DATABASE_URL`을 복사한 Supabase 주소로 변경하기
- [ ] `prisma/schema.prisma` 파일의 `provider`를 `sqlite`에서 `postgresql`로 변경하기:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- [ ] 터미널에서 로컬 마이그레이션 실행 (클라우드 DB에 테이블 스키마 밀어넣기):
  ```bash
  npx prisma generate
  npx prisma db push
  ```

## 3. 시놀로지 NAS 설정 및 무중단 배포 적용
- [ ] NAS의 `/volume1/zenespace/web/FluxX/prisma/schema.prisma` 파일을 열어 Mac과 동일하게 `provider = "postgresql"` 설정 반영하기
- [ ] NAS의 `/volume1/zenespace/web/FluxX/.env` 파일 내 `DATABASE_URL` 주소도 Supabase 주소로 교체하기
- [ ] NAS 터미널에 SSH 접속 후 다음 명령어로 앱 빌드 및 실행:
  ```bash
  cd /volume1/zenespace/web/FluxX
  sudo npm exec prisma generate
  sudo npm run build
  sudo npm install -g pm2
  sudo pm2 start npm --name "fluxx" -- start
  sudo pm2 save
  sudo pm2 startup
  ```

## 4. (선택) 외부망 접속 처리
- [ ] 시놀로지 제어판 > 로그인 포털 > 역방향 프록시에서 `https://내도메인`을 내부 `localhost:3000`으로 매핑하기
