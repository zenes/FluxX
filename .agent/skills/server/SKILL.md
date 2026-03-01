---
name: "server"
description: "모바일 기기 접속을 위한 개발 서버 설정 및 접속 정보를 제공합니다."
---

# Server Skill 지침

사용자가 모바일 접속 방법이나 'server' 스킬을 요청할 경우 다음 절차를 따르세요.

## 실행 절차

1.  **개발 서버 실행 안내**:
    - 모바일 접속용 서버 실행 명령어(`npm run dev:mobile`)를 안내합니다.
2.  **IP 주소 확인**:
    - `.agent/skills/server/scripts/get-ip.sh` 스크립트를 실행하여 현재 Mac의 IP 주소를 확인합니다.
3.  **접속 정보 제공**:
    - **방법 A (Wi-Fi)**: `http://[Mac-IP]:3000` 주소를 안내합니다.
    - **방법 B (인터넷 공유)**: Mac의 인터넷 공유 설정을 통한 접속 방법과 `http://192.168.3.1:3000` 주소를 안내합니다.
4.  **트러블슈팅 안내**:
    - 방화벽 설정 확인 및 포트 충돌 시 대응 방법(3001 등)을 설명합니다.

## 참고 문서
- [MOBILE_CONNECTION.md](file:///Users/sj/Project/FluxX/docs/MOBILE_CONNECTION.md)
