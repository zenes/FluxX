# 📌 Vercel 배포 및 DB 마이그레이션 할 일 (TODO)

## 1. 현재 상태 백업 (완료)
- [x] 현재 상태(`dividend` 구현) 태그 저장 (`v2.0.0-dividend`)
- [x] Vercel 전용 브랜치(`deploy/vercel`) 분리

## 2. Supabase (클라우드 DB) 세팅 (완료)
- [x] [Supabase 홈페이지](https://supabase.com) 접속 및 새 프로젝트 생성 (`fluxx-db` 등)
- [x] 데이터베이스 비밀번호 안전한 곳에 백업/기록하기
- [x] **Project Settings > Database > URI** 탭에서 Connection String 주소 복사하기
- [x] 복사한 주소의 `[YOUR-PASSWORD]` 부분을 실제 비밀번호로 치환하기

## 3. 로컬(Mac) 프로젝트 설정 변경 (완료)
- [x] `.env` 파일의 `DATABASE_URL`을 복사한 Supabase 주소로 변경하기
- [x] `prisma/schema.prisma` 파일의 `provider`를 `sqlite`에서 `postgresql`로 변경하기
- [x] 터미널에서 로컬 마이그레이션 실행 (클라우드 DB에 테이블 스키마 밀어넣기)

## 4. Github 푸시 및 Vercel 연동 배포 (준비 완료)
- [x] 변경된 환경 설정(Prisma 등) 및 빌드 에러 수정사항을 현재 브랜치(`deploy/vercel`)에 커밋 및 푸시 가능 상태
- [ ] [Vercel 홈페이지](https://vercel.com) 접속 및 Github 저장소 가져오기 (Import Project)
- [ ] Vercel 환경 변수(Environment Variables) 설정에 `DATABASE_URL`, `DIRECT_URL` 추가
- [ ] 배포(Deploy) 클릭 후 성공 확인
