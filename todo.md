# 📌 Vercel 배포 및 DB 마이그레이션 할 일 (TODO)

## 1. 현재 상태 백업 (완료)
- [x] 현재 상태(`dividend` 구현) 태그 저장 (`v2.0.0-dividend`)
- [x] Vercel 전용 브랜치(`deploy/vercel`) 분리

## 2. Supabase (클라우드 DB) 세팅
- [ ] [Supabase 홈페이지](https://supabase.com) 접속 및 새 프로젝트 생성 (`fluxx-db` 등)
- [ ] 데이터베이스 비밀번호 안전한 곳에 백업/기록하기
- [ ] **Project Settings > Database > URI** 탭에서 Connection String 주소 복사하기
- [ ] 복사한 주소의 `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 치환하기

## 3. 로컬(Mac) 프로젝트 설정 변경
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

## 4. Github 푸시 및 Vercel 연동 배포
- [ ] 프론트엔드 환경구성을 변경(`prisma/schema.prisma` 등)한 후 현재 브랜치(`deploy/vercel`)에 커밋 및 푸시
- [ ] [Vercel 홈페이지](https://vercel.com) 접속 및 내 Github 계정 연동 -> `FluxX` 저장소 Import
- [ ] Vercel 배포 설정 중 **Environment Variables** 항목에 `DATABASE_URL`과 변경된 주소 추가
- [ ] `Deploy` 버튼을 눌러 자동 빌드 및 배포 시작
- [ ] 생성된 무료 Vercel 도메인 파악 및 모바일 접속 테스트

