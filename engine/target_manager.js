const fs = require('fs');
const path = require('path');

/**
 * 타겟 아파트 및 전략 카테고리 관리자
 */
class TargetManager {
    constructor() {
        this.targetsPath = path.join(__dirname, '../data/viral_targets.json');
        this.strategyPath = path.join(__dirname, '../data/marketing_strategy.json');
    }

    /**
     * 오늘 날짜에 가장 적합한 타겟과 마케팅 전략을 선택
     */
    getNextTarget() {
        const targets = JSON.parse(fs.readFileSync(this.targetsPath, 'utf8'));
        const today = new Date().toISOString().split('T')[0];
        
        // 1. 오늘 날짜 스케줄 확인
        let target = targets.find(t => t.scheduled_date === today && t.status !== 'completed');
        
        // 2. 스케줄이 없으면 활성 상태 중 가장 오래된 것 선택
        if (!target) {
            target = targets.find(t => t.status === 'active');
        }

        if (!target) return null;

        // 3. 타겟 속성에 따라 마케팅 전략(4대 타겟 중 하나) 매칭
        // 기본값은 'new_apartment'이나, 랜덤이나 순환 로직으로 변경 가능
        let strategyKey = 'new_apartment';
        if (target.move_in_date && target.move_in_date.includes('2026')) {
            strategyKey = 'new_apartment';
        } else {
            // 입주가 멀었거나 일반 지역인 경우 'subscription'이나 'wedding'으로 로테이션
            const keys = ['subscription', 'wedding', 'relocation'];
            strategyKey = keys[Math.floor(Math.random() * keys.length)];
        }

        return { ...target, strategyKey };
    }

    markCompleted(targetId) {
        const targets = JSON.parse(fs.readFileSync(this.targetsPath, 'utf8'));
        const target = targets.find(t => t.id === targetId);
        if (target) {
            target.status = 'completed';
            fs.writeFileSync(this.targetsPath, JSON.stringify(targets, null, 2));
        }
    }
}

module.exports = TargetManager;
