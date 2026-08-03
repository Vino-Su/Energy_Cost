(function (global) {
    'use strict';

    /*
     * 巡查任务示例数据
     * 状态机（对齐 PRD 4.1）：待接收 pending / 进行中 running / 已完成 done / 已转派 transferred / 已终止 terminated / 已失效 invalid
     * 卡片分组（对齐 PRD 6.2.3）：
     *   - 待接收：pending
     *   - 进行中：running
     *   - 已结束：done + transferred + terminated + invalid
     * planDate 为任务计划执行日期，用于日期筛选
     * no    任务编号（PRD 6.1.2 详情页展示用，长编号 RW...）
     * code  短编号（与 inspection-problem-data.js 的 taskId 对齐，用于详情页关联事件上报列表；
     *       前缀 I00x 同时与 inspection-map.html 的 TASKS.id 对齐，使地图页「任务详情」按钮与服务列表页详情共用同一详情页）
     * problemCount 与 code 关联的事件数量保持一致
     *
     * T001~T004 与地图页 TASKS（I001~I004）对齐：片区、状态、作业时间、开始时间、里程、时长保持一致
     */

    var records = [
        {
            id: 'T001', no: 'RW20260803001', code: 'I001', area: '滨江路东段', status: 'done', statusText: '已完成',
            planDate: '2026-08-03', workTime: '08:00~10:00', resource: '巡查员 张明',
            type: '品质巡查', workType: '路面质检', coordinate: '113.2640,23.1290', radius: 300,
            startAt: '08:02', mileage: 9.42, duration: 118, problemCount: 1,
            remark: '任务已完成，事件均已现场处置并复核通过。'
        },
        {
            id: 'T002', no: 'RW20260803002', code: 'I002', area: '中央广场片区', status: 'pending', statusText: '待接收',
            planDate: '2026-08-03', workTime: '10:30~12:00', resource: '巡查员 李华',
            type: '品质巡查', workType: '路面质检', coordinate: '113.2710,23.1350', radius: 320,
            startAt: '—', mileage: null, duration: null, problemCount: 1,
            remark: '重点巡查广场北门及绿化带卫生情况。'
        },
        {
            id: 'T003', no: 'RW20260803003', code: 'I003', area: '解放南路沿线', status: 'pending', statusText: '待接收',
            planDate: '2026-08-03', workTime: '13:30~15:00', resource: '巡查员 王建国',
            type: '品质巡查', workType: '路面质检', coordinate: '113.2670,23.1240', radius: 350,
            startAt: '—', mileage: null, duration: null, problemCount: 2,
            remark: '沿线巡查解放南路匝道与文昌路口路况。'
        },
        {
            id: 'T004', no: 'RW20260803004', code: 'I004', area: '人民东路-文昌路', status: 'pending', statusText: '待接收',
            planDate: '2026-08-03', workTime: '15:30~17:00', resource: '巡查员 赵敏',
            type: '品质巡查', workType: '路面质检', coordinate: '113.2700,23.1220', radius: 300,
            startAt: '—', mileage: null, duration: null, problemCount: 1,
            remark: '下午班次，注意人民东路与文昌路交叉口通行状况。'
        },
        {
            id: 'T005', no: 'RW20260802004', code: 'I005', area: '湖畔公园片区', status: 'done', statusText: '已完成',
            planDate: '2026-08-03', workTime: '05:30~09:00', resource: '巡查员 周倩',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9486,22.5279', radius: 260,
            startAt: '05:33', mileage: 5.47, duration: 207, problemCount: 1,
            remark: '任务已完成，事件均已现场处置并复核通过。'
        },
        {
            id: 'T006', no: 'RW20260801009', code: 'I006', area: '文昌路片区', status: 'done', statusText: '已完成',
            planDate: '2026-08-02', workTime: '13:00~16:30', resource: '巡查员 刘晨',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9561,22.5324', radius: 290,
            startAt: '13:02', mileage: 6.13, duration: 208, problemCount: 1,
            remark: '社区西门人行道破损已上报市政，事件关闭。'
        },
        {
            id: 'T007', no: 'RW20260803005', code: '', area: '科技园片区', status: 'running', statusText: '进行中',
            planDate: '2026-08-03', workTime: '06:00~09:30', resource: '巡查员 王建国',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9294,22.5481', radius: 350,
            startAt: '06:02', mileage: 4.82, duration: 88, problemCount: 0,
            remark: '正在执行巡查，注意科技园南侧公交站及设施情况。'
        },
        {
            id: 'T008', no: 'RW20260802007', code: 'I008', area: '兴业路片区', status: 'running', statusText: '进行中',
            planDate: '2026-08-03', workTime: '09:00~12:00', resource: '巡查员 赵敏',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9173,22.5432', radius: 300,
            startAt: '09:05', mileage: 2.16, duration: 23, problemCount: 1,
            remark: '上午班次，注意兴业路东段共享单车违停问题。'
        },
        {
            id: 'T009', no: 'RW20260731003', code: '', area: '创新大道片区', status: 'transferred', statusText: '已转派',
            planDate: '2026-08-03', workTime: '14:00~17:00', resource: '巡查员 陈浩',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9248,22.5507', radius: 310,
            startAt: '—', mileage: null, duration: null, problemCount: 0,
            remark: '原巡查员临时请假，已转派至其他班组接替。'
        },
        {
            id: 'T010', no: 'RW20260801012', code: '', area: '高新一路片区', status: 'terminated', statusText: '已终止',
            planDate: '2026-08-01', workTime: '18:00~21:00', resource: '巡查员 王芳',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9387,22.5591', radius: 270,
            startAt: '—', mileage: null, duration: null, problemCount: 0,
            remark: '因突发暴雨天气，任务予以终止。'
        },
        {
            id: 'T011', no: 'RW20260730005', code: '', area: '创业路片区', status: 'invalid', statusText: '已失效',
            planDate: '2026-07-30', workTime: '22:00~01:00', resource: '巡查员 张明',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9136,22.5522', radius: 250,
            startAt: '—', mileage: null, duration: null, problemCount: 0,
            remark: '巡查员未在有效时段内接收，任务自动失效。'
        },
        {
            id: 'T012', no: 'RW20260804001', code: '', area: '云杉路片区', status: 'pending', statusText: '待接收',
            planDate: '2026-08-04', workTime: '06:30~10:00', resource: '巡查员 李华',
            type: '品质巡查', workType: '路面质检', coordinate: '113.9051,22.5468', radius: 280,
            startAt: '—', mileage: null, duration: null, problemCount: 0,
            remark: '明日早班任务，请注意按时签到。'
        }
    ];

    // 分组定义：tab key -> 包含的状态
    var GROUPS = {
        pending: { label: '待接收', statuses: ['pending'] },
        running: { label: '进行中', statuses: ['running'] },
        ended: { label: '已结束', statuses: ['done', 'transferred', 'terminated', 'invalid'] }
    };

    var byId = {};
    records.forEach(function (item) { byId[item.id] = item; });
    global.INSPECTION_TASK_RECORDS = records;
    global.INSPECTION_TASK_BY_ID = byId;
    global.INSPECTION_TASK_GROUPS = GROUPS;
}(window));
