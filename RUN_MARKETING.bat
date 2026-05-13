@echo off
title JCC 진센조 마케팅 자동화 엔진
echo ===================================================
echo   JCC Jincencho Marketing Automation System
echo ===================================================
echo.
echo [1/3] 오늘자 최우선 타겟 분석 중...
node engine/generate_full_package.js
echo.
echo [2/3] (SKIPPED) 네이버 블로그 자동 업로드가 중지되었습니다 (수동 전용).
REM node auto_publisher.js
echo.
echo [3/3] Obsidian 리포트 동기화 중...
node marketing_vault/scripts/sync_targets.js
echo.
echo ===================================================
echo   ✅ 오늘자 모든 마케팅 작업이 완료되었습니다!
echo   Obsidian에서 리포트를 확인하세요.
echo ===================================================
pause
