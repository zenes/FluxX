---
description: 프로젝트 로컬 개발 환경 설정을 자동화합니다. (Node.js 버전 업그레이드 및 서버 실행)
---

이 워크플로우는 Next.js 14 실행을 위해 필요한 Node.js 환경을 검사하고 구축합니다.

1. **Node.js 버전 확인**
   현재 설치된 Node.js 버전을 확인합니다. v18.17.0 이상이 필요합니다.
   ```bash
   node -v
   ```

2. **버전이 낮을 경우 업그레이드 (Mac/Homebrew 기준)**
   // turbo
   ```bash
   brew install node@20 && brew link --overwrite node@20
   ```

3. **의존성 설치**
   ```bash
   npm install
   ```

4. **프리즈마 스키마 적용**
   ```bash
   npx prisma generate
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 결과를 확인할 수 있습니다.
