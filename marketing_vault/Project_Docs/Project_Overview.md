# 🚀 JCC 진센조 프로젝트 개요

## 📋 프로젝트 목적
'JCC 진센조' 브랜드의 바이럴 마케팅을 전격 자동화하고 시스템화하여, 프리미엄 가전 컨설팅 서비스를 효율적으로 홍보함.

## 🏗️ 시스템 아키텍처
- **언어/환경**: Node.js, JavaScript
- **콘텐츠 생성**: `ContentGenerator` 클래스를 통한 멀티 채널 원고 생성 (GPT 기반 전략 활용)
- **이미지 생성**: Playwright를 사용하여 HTML/CSS 템플릿을 고해상도 PNG로 렌더링
- **매니지먼트**: Obsidian을 통한 지식 베이스 관리 및 시각화
- **채널**: 네이버 블로그, 인스타그램, 스레드, 페이스북, 유튜브

## 📊 현재 상태 (2026-05-11)
- **자동화 수준**: 원고 생성 및 이미지 렌더링 자동화 완료
- **데이터베이스**: `viral_targets.json`을 통한 10개 이상의 아파트 단지 타겟팅 관리 중
- **통합 관리**: Obsidian Vault(`marketing_vault`)를 통한 타겟 및 히스토리 관리 체계 구축 완료

## 🛠️ 주요 도구 및 스크립트
- `engine/content_generator.js`: 핵심 콘텐츠 생성 로직
- `engine/generate_full_package.js`: 일일 마케팅 패키지 생성
- `marketing_vault/scripts/sync_targets.js`: JSON 데이터를 옵시디언 노트로 동기화

---
*이 문서는 Antigravity AI에 의해 작성되었으며, 옵시디언 내 AI 플러그인의 문맥 파악을 돕기 위해 설계되었습니다.*
