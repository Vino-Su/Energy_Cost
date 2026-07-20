(function (global) {
    'use strict';

    var commonSegments = {
        south: [
            { startId: 'SEG-SZ-001', name: '科苑南路南行段', attribute: '城市主干道', mode: '洗扫', count: '2 次', direction: '由北向南', lane: '机动车道 1、2 车道' },
            { startId: 'SEG-SZ-002', name: '高新南九道东行段', attribute: '城市次干道', mode: '冲洗', count: '1 次', direction: '由西向东', lane: '最右侧机动车道' }
        ],
        west: [
            { startId: 'SEG-SZ-101', name: '沙河西路北段', attribute: '城市快速路辅路', mode: '高压冲洗', count: '2 次', direction: '由北向南', lane: '辅道及非机动车道' },
            { startId: 'SEG-SZ-102', name: '沙河西路南段', attribute: '城市主干道', mode: '洗扫', count: '2 次', direction: '由南向北', lane: '机动车道 1、2 车道' }
        ]
    };

    function makeRouteTask(config) {
        return {
            id: config.id,
            listType: 'schedule',
            type: config.taskType || '常态任务',
            kind: 'route',
            tone: config.taskType === '临时任务' ? 'temporary' : 'regular',
            status: config.status,
            name: config.name,
            workType: config.workType,
            number: config.number,
            date: config.date,
            time: config.time,
            driver: '李四',
            plateNo: config.plateNo,
            vehicle: config.plateNo || '未分配车辆',
            requirement: config.requirement,
            routeId: config.routeId,
            routeName: config.routeName,
            routePoints: config.routePoints || [[8, 28], [22, 36], [38, 32], [52, 48], [68, 44], [82, 61], [94, 54]],
            segments: config.segments || commonSegments.south,
            // V1.12 任务完成信息字段（已完成：actualStartTime/actualEndTime/mileage/duration；进行中：actualStartTime/currentMileage/currentDuration）
            actualStartTime: null,
            actualEndTime: null,
            currentMileage: null,
            currentDuration: null,
            mileage: null,
            duration: null
        };
    }

    function makeDynamicTask(config) {
        var issueNumber = config.issueNumber || String(config.number || '').replace(/^DTRW/, 'WT');
        return {
            id: config.id,
            listType: 'dynamic',
            type: '动态任务',
            kind: 'issue',
            tone: 'dynamic',
            status: config.status,
            name: config.name,
            workType: '动态问题处置',
            number: issueNumber,
            issueNumber: issueNumber,
            date: config.dispatchedAt.slice(0, 10),
            dispatchedAt: config.dispatchedAt,
            dispatchTime: config.dispatchedAt,
            driver: '李四',
            plateNo: config.plateNo,
            vehicle: config.plateNo || '未分配车辆',
            coordinates: config.coordinates,
            location: config.location,
            detailedLocation: config.detailedLocation || '',
            issueType: config.issueType || '问题类型待确认',
            severity: config.severity,
            evidence: config.evidence || [
                { label: '现场全景', visual: 'debris' },
                { label: '问题近照', visual: 'waste' }
            ],
            point: config.point,
            // V1.12 任务完成信息字段（已完成：actualStartTime/actualEndTime/mileage/duration；进行中：actualStartTime/currentMileage/currentDuration）
            actualStartTime: null,
            actualEndTime: null,
            currentMileage: null,
            currentDuration: null,
            mileage: null,
            duration: null
        };
    }

    global.TASK_DETAIL_DATA = {
        '1': {
            id: '1', listType: 'schedule', type: '常态任务', kind: 'route', tone: 'regular', status: 'pending',
            name: '科技园南区道路清扫', workType: '道路清扫', number: 'CGRW2026042800001', date: '2026-04-28',
            time: '08:30~10:30', driver: '李四', vehicle: '粤 B·D2856',
            routeId: 'route232982', routeName: '科苑南路至高新南九道',
            routePoints: [[10, 26], [24, 36], [38, 32], [50, 47], [66, 44], [82, 64], [94, 58]],
            segments: commonSegments.south
        },
        '2': {
            id: '2', listType: 'schedule', type: '临时任务', kind: 'route', tone: 'temporary', status: 'pending',
            name: '沙河西路临时处置', workType: '临时处置', number: 'LSRW2026042800001', date: '2026-04-28',
            time: '10:30~11:30', driver: '李四', vehicle: '粤 B·D2856',
            routeId: 'route232986', routeName: '沙河西路全段',
            routePoints: [[8, 66], [22, 59], [35, 62], [48, 49], [63, 52], [76, 34], [94, 27]],
            segments: commonSegments.west
        },
        '3': {
            id: '3', listType: 'schedule', type: '常态任务', kind: 'route', tone: 'regular', status: 'pending',
            name: '滨海大道夜间冲洗', workType: '夜间冲洗', number: 'CGRW2026042800003', date: '2026-04-28',
            time: '22:00~23:30', driver: '李四', vehicle: '粤 B·D2856',
            routeId: 'route232988', routeName: '滨海大道科技园段',
            routePoints: [[7, 70], [23, 66], [39, 67], [54, 56], [70, 59], [94, 48]],
            segments: [
                { name: '滨海大道西行段', attribute: '城市快速路', mode: '高压冲洗', count: '1 次', direction: '由东向西', lane: '最右侧机动车道' },
                { name: '滨海大道辅道段', attribute: '城市快速路辅路', mode: '洗扫', count: '1 次', direction: '由西向东', lane: '辅道全幅' }
            ]
        },
        '4': {
            id: '4', listType: 'schedule', type: '常态任务', kind: 'route', tone: 'regular', status: 'pending',
            name: '高新南九道日常巡检', workType: '日常巡检', number: 'CGRW2026042800004', date: '2026-04-28',
            time: '14:00~15:00', driver: '李四', vehicle: '粤 B·D2856',
            routeId: 'route232990', routeName: '高新南九道巡检路线',
            routePoints: [[12, 22], [28, 31], [45, 29], [61, 42], [78, 39], [92, 51]],
            segments: [
                { name: '高新南九道西段', attribute: '城市次干道', mode: '人工巡检', count: '1 次', direction: '由西向东', lane: '道路两侧' },
                { name: '高新南九道东段', attribute: '城市次干道', mode: '人工巡检', count: '1 次', direction: '由东向西', lane: '道路两侧' }
            ]
        },
        '5': {
            id: '5', listType: 'schedule', type: '常态任务', kind: 'route', tone: 'regular', status: 'pending',
            name: '南山垃圾中转站对接', workType: '垃圾中转对接', number: 'CGRW2026042800005', date: '2026-04-28',
            time: '16:00~17:00', driver: '李四', vehicle: '粤 B·D2856',
            routeId: 'route232993', routeName: '科技园至南山中转站',
            routePoints: [[9, 31], [25, 38], [40, 49], [57, 46], [73, 61], [92, 68]],
            segments: [
                { name: '科技园出发段', attribute: '城市支路', mode: '转运', count: '1 次', direction: '由东向西', lane: '机动车道' },
                { name: '中转站接驳段', attribute: '场站道路', mode: '转运', count: '1 次', direction: '进站方向', lane: '指定作业通道' }
            ]
        },
        '6': {
            id: '6', listType: 'dynamic', type: '动态任务', kind: 'issue', tone: 'dynamic', status: 'pending',
            name: '科技园南门垃圾遗漏复核', workType: '垃圾遗漏复核', dispatchTime: '2026-04-28 10:00:00', issueNumber: 'WT2026042800001', number: 'WT2026042800001',
            driver: '李四', vehicle: '粤 B·D2856',
            coordinates: ['114.38, 22.69', '114.3812, 22.6896'],
            location: '李屋小区内，李屋居民小组党群服务站附近 17 米',
            detailedLocation: '深圳市南山区西丽街道李屋小区 3 栋东侧辅道，靠近党群服务站出入口',
            issueType: '明显垃圾', severity: '紧急',
            evidence: [
                { label: '现场全景', visual: 'debris' },
                { label: '问题近照', visual: 'waste' }
            ],
            point: [62, 44]
        }
    };

    Object.assign(global.TASK_DETAIL_DATA, {
        // 地图工作台 tasks 数组里的 7、8 号任务（临时/常态 route），用于修复"任务详情显示不存在"bug
        '7': makeRouteTask({
            id: '7', listType: 'schedule', taskType: '临时任务', status: 'pending', name: '科技园北门路面冲洗', workType: '路面冲洗',
            number: 'LSRW2026042800007', date: '2026-04-28', time: '09:00~10:00', plateNo: '粤B·E550F',
            routeId: 'route232987', routeName: '科技园北门', requirement: '临时派发路面油污冲洗，要求 30 分钟内到场。'
        }),
        '8': makeRouteTask({
            id: '8', listType: 'schedule', status: 'pending', name: '高新南片区巡检', workType: '巡检',
            number: 'CGRW2026042800008', date: '2026-04-28', time: '11:00~12:00', plateNo: '粤B·A118G',
            routeId: 'route232989', routeName: '高新南片区', requirement: '片区道路洁净度巡检，处理零星垃圾点。'
        }),
        'P01': makeRouteTask({
            id: 'P01', listType: 'schedule', status: 'pending', name: '科技园南区道路清扫', workType: '道路清扫',
            number: 'CGRW202607110001', date: '2026-07-11', time: '08:30~10:30', plateNo: '粤B·8829D',
            routeId: 'route240101', routeName: '科苑南路至高新南九道', requirement: '洗扫车覆盖道路两侧及辅道，作业速度不超过 25km/h。'
        }),
        'P02': makeRouteTask({
            id: 'P02', listType: 'schedule', status: 'pending', name: '高新南九道日常巡检', workType: '日常巡检',
            number: 'CGRW202607110002', date: '2026-07-11', time: '14:00~15:00', plateNo: '粤B·5517E',
            routeId: 'route240102', routeName: '高新南九道', requirement: '巡检道路洁净度并处理零星垃圾点。'
        }),
        'P03': makeRouteTask({
            id: 'P03', listType: 'schedule', status: 'pending', name: '南山垃圾中转站对接', workType: '垃圾转运',
            number: 'CGRW202607110003', date: '2026-07-11', time: '16:00~17:00', plateNo: '粤B·3368F',
            routeId: 'route240103', routeName: '南山站', requirement: '前往中转站完成车辆对接和站点清洁确认。'
        }),
        'P04': makeRouteTask({
            id: 'P04', listType: 'schedule', status: 'pending', name: '滨海大道夜间冲洗', workType: '夜间冲洗',
            number: 'CGRW202607110004', date: '2026-07-11', time: '19:00~22:00', plateNo: '粤B·7720A',
            routeId: 'route240104', routeName: '滨海大道东段', requirement: '夜间冲洗主干道，避开交通高峰，保持低速匀速作业。'
        }),
        'R01': makeRouteTask({
            id: 'R01', listType: 'schedule', status: 'executing', name: '西丽留仙洞片区道路清扫', workType: '道路清扫',
            number: 'CGRW202607110005', date: '2026-07-11', time: '08:00~10:00', plateNo: '粤B·A778K',
            routeId: 'route240105', routeName: '西丽留仙洞片区', requirement: '机扫与冲洗配合，覆盖主路及非机动车道。'
        }),
        'R02': makeRouteTask({
            id: 'R02', listType: 'schedule', status: 'executing', name: '海岸城周边精细化保洁', workType: '精细化保洁',
            number: 'CGRW202607110006', date: '2026-07-11', time: '10:30~12:00', plateNo: '粤B·B229L',
            routeId: 'route240106', routeName: '海岸城片区', requirement: '人工保洁配合机扫，重点处理商业广场周边。'
        }),
        'R03': makeRouteTask({
            id: 'R03', listType: 'schedule', status: 'executing', name: '蛇口午后洒水降尘', workType: '洒水降尘',
            number: 'CGRW202607110007', date: '2026-07-11', time: '13:00~14:30', plateNo: '粤B·C560M',
            routeId: 'route240107', routeName: '蛇口工业路至太子路', requirement: '午后高温时段洒水降尘，控制水压避免溅洒行人。'
        }),
        'D01': makeRouteTask({
            id: 'D01', listType: 'schedule', status: 'completed', name: '麒麟立交桥底冲洗', workType: '桥下冲洗',
            number: 'CGRW202607110008', date: '2026-07-11', time: '06:00~07:30', plateNo: '粤B·1126H',
            routeId: 'route240108', routeName: '麒麟立交桥底', requirement: '桥下冲洗，重点处理桥墩及排水沟。'
        }),
        'D02': makeRouteTask({
            id: 'D02', listType: 'schedule', status: 'completed', name: '深南大道机扫', workType: '道路机扫',
            number: 'CGRW202607110009', date: '2026-07-11', time: '05:00~07:00', plateNo: '粤B·2098J',
            routeId: 'route240109', routeName: '深南大道东段至西段', requirement: '主干道机扫，覆盖双方向六个车道。'
        }),
        'D03': makeRouteTask({
            id: 'D03', listType: 'schedule', status: 'delegated', name: '后海片区清扫保洁', workType: '清扫保洁',
            number: 'CGRW202607110010', date: '2026-07-11', time: '05:30~07:30', plateNo: '粤B·3310G',
            routeId: 'route240110', routeName: '后海大道至滨海大道', requirement: '片区清扫保洁协同作业。'
        }),
        'D04': makeRouteTask({
            id: 'D04', listType: 'schedule', status: 'terminated', name: '南山科技园晨间机扫', workType: '晨间机扫',
            number: 'CGRW202607110011', date: '2026-07-11', time: '07:00~08:30', plateNo: '粤B·7791N',
            routeId: 'route240111', routeName: '科苑南路至高新南九道', requirement: '晨间机扫避开上班高峰。'
        }),
        'D05': makeRouteTask({
            id: 'D05', listType: 'schedule', status: 'invalid', name: '科苑路夜班洒水', workType: '夜班洒水',
            number: 'CGRW202607110012', date: '2026-07-11', time: '02:00~04:00', plateNo: '粤B·6082P',
            routeId: 'route240112', routeName: '科苑路全段', requirement: '夜班洒水降尘。'
        }),
        'D06': makeRouteTask({
            id: 'D06', listType: 'schedule', status: 'completed', name: '前海合作区机扫', workType: '道路机扫',
            number: 'CGRW202607090013', date: '2026-07-09', time: '05:00~07:00', plateNo: '粤B·9981Q',
            routeId: 'route240113', routeName: '前海合作区主干道', requirement: '周末机扫加强保洁质量。'
        }),
        'E-P01': makeRouteTask({
            id: 'E-P01', listType: 'schedule', taskType: '临时任务', status: 'pending', name: '沙河西路污染点临时冲洗', workType: '污染点处置',
            number: 'LSRW202607110001', date: '2026-07-11', time: '11:20~12:20', plateNo: '粤B·D620Q',
            routeId: 'route250201', routeName: '沙河西路北段', requirement: '接令后 30 分钟内到场，优先清除路面油污并设置安全警示。', segments: commonSegments.west
        }),
        'E-P02': makeRouteTask({
            id: 'E-P02', listType: 'schedule', taskType: '临时任务', status: 'pending', name: '前海桂湾路积水临时处置', workType: '道路积水处置',
            number: 'LSRW202607110002', date: '2026-07-11', time: '15:00~16:00', plateNo: '粤B·E315R',
            routeId: 'route250202', routeName: '前海桂湾路', requirement: '清理雨水口周边杂物，协同排水并反馈现场水位。', segments: commonSegments.west
        }),
        'E-R01': makeRouteTask({
            id: 'E-R01', listType: 'schedule', taskType: '临时任务', status: 'executing', name: '南海大道抛洒物清理', workType: '抛洒物清理',
            number: 'LSRW202607110003', date: '2026-07-11', time: '09:40~10:40', plateNo: '粤B·F806S',
            routeId: 'route250203', routeName: '南海大道南行段', requirement: '封控最右侧车道并快速清除抛洒物，作业全程开启警示灯。', segments: commonSegments.west
        }),
        'E-R02': makeRouteTask({
            id: 'E-R02', listType: 'schedule', taskType: '临时任务', status: 'executing', name: '滨海大道事故路面清洗', workType: '事故路面清洗',
            number: 'LSRW202607110004', date: '2026-07-11', time: '10:10~11:10', plateNo: '粤B·G972T',
            routeId: 'route250204', routeName: '滨海大道西行段', requirement: '配合现场交警完成路面清洗，确保恢复通行后再撤离。', segments: commonSegments.west
        }),
        'E-D01': makeRouteTask({
            id: 'E-D01', listType: 'schedule', taskType: '临时任务', status: 'completed', name: '科技南十二路树枝清运', workType: '障碍物清运',
            number: 'LSRW202607110005', date: '2026-07-11', time: '07:10~08:00', plateNo: '粤B·H118U',
            routeId: 'route250205', routeName: '科技南十二路', requirement: '完成倒伏树枝切割和清运，确认道路恢复通行。'
        }),
        'E-D02': makeRouteTask({
            id: 'E-D02', listType: 'schedule', taskType: '临时任务', status: 'completed', name: '月亮湾大道泥沙清理', workType: '泥沙清理',
            number: 'LSRW202607100006', date: '2026-07-10', time: '18:20~19:30', plateNo: '',
            routeId: 'route250206', routeName: '月亮湾大道辅路', requirement: '清除强降雨后道路泥沙并冲洗路面。'
        }),
        'T-P01': makeDynamicTask({
            id: 'T-P01', status: 'pending', name: '科技园北区垃圾遗漏复核', number: 'DTRW202607110001',
            dispatchedAt: '2026-07-11 09:25:00', plateNo: '粤B·J226V', coordinates: ['113.9462, 22.5371'],
            location: '科技园北区科丰路公交站南侧 30 米', issueType: '明显垃圾', severity: '紧急', point: [64, 40],
            detailedLocation: '深圳市南山区科技园北区科丰路西侧，B666 路公交站往南 30 米辅道树池旁'
        }),
        'T-P02': makeDynamicTask({
            id: 'T-P02', status: 'pending', name: '后海大道雨水口堵塞复核', number: 'DTRW202607110002',
            dispatchedAt: '2026-07-11 13:05:00', plateNo: '粤B·K337W', coordinates: ['113.9368, 22.5189'],
            location: '后海大道与海德一道交叉口东北角', issueType: '雨水口堵塞', severity: '一般', point: [42, 61],
            detailedLocation: '深圳市南山区后海大道与海德一道交叉口东北角，人行道雨水箅子位置，靠近海印小区出入口'
        }),
        'T-R01': makeDynamicTask({
            id: 'T-R01', status: 'executing', name: '深南大道油污遗撒处置', number: 'DTRW202607110003',
            dispatchedAt: '2026-07-11 10:18:00', plateNo: '粤B·L448X', coordinates: ['113.9531, 22.5405', '113.9538, 22.5402'],
            location: '深南大道科技园段西行辅路', issueType: '油污遗撒', severity: '紧急', point: [72, 46],
            detailedLocation: '深圳市南山区深南大道科技园段西行辅路 K12+800 处，科苑天桥下方右侧车道'
        }),
        'T-R02': makeDynamicTask({
            id: 'T-R02', status: 'executing', name: '南山书城大件垃圾处置', number: 'DTRW202607110004',
            dispatchedAt: '2026-07-11 11:42:00', plateNo: '粤B·M559Y', coordinates: ['113.9342, 22.5226'],
            location: '南山书城北侧装卸区入口', issueType: '大件垃圾', severity: '一般', point: [38, 52],
            detailedLocation: '深圳市南山区南海大道南山书城北侧装卸区入口 2 号闸门内右侧堆放点'
        }),
        'T-D01': makeDynamicTask({
            id: 'T-D01', status: 'completed', name: '科苑路路面垃圾闭环', number: 'DTRW202607110005',
            dispatchedAt: '2026-07-11 07:20:00', plateNo: '粤B·N660Z', coordinates: ['113.9448, 22.5362'],
            location: '科苑路与高新南九道交叉口西侧', issueType: '明显垃圾', severity: '一般', point: [58, 49],
            detailedLocation: '深圳市南山区科苑路与高新南九道交叉口西侧，地铁 9 号线高新南站 C 出口外辅道'
        }),
        'T-D02': makeDynamicTask({
            id: 'T-D02', status: 'completed', name: '蛇口工业路垃圾桶满溢闭环', number: 'DTRW202607100006',
            dispatchedAt: '2026-07-10 16:35:00', plateNo: '粤B·P771A', coordinates: ['113.9165, 22.4941'],
            location: '蛇口工业路四海公园东门', issueType: '垃圾桶满溢', severity: '一般', point: [28, 67],
            detailedLocation: '深圳市南山区蛇口工业路四海公园东门北侧 20 米，3 号垃圾分类投放点'
        })
    });

    Object.keys(global.TASK_DETAIL_DATA).forEach(function (taskId) {
        var task = global.TASK_DETAIL_DATA[taskId];
        (task.segments || []).forEach(function (segment, index) {
            if (!segment.startId) segment.startId = 'SEG-' + taskId + '-' + String(index + 1).padStart(2, '0');
        });
    });

    // V1.12 任务完成信息字段补全（已完成任务：实际开始/结束 + 里程/时长；进行中任务：实际开始 + 当前里程/时长）
    Object.assign(global.TASK_DETAIL_DATA['D01'], {
        actualStartTime: '2026-07-11 06:02:15', actualEndTime: '2026-07-11 07:35:48',
        mileage: '4.80', duration: 93
    });
    Object.assign(global.TASK_DETAIL_DATA['D02'], {
        actualStartTime: '2026-07-11 05:00:32', actualEndTime: '2026-07-11 07:08:21',
        mileage: '18.50', duration: 128
    });
    Object.assign(global.TASK_DETAIL_DATA['D03'], {
        actualStartTime: '2026-07-10 05:32:48', actualEndTime: '2026-07-10 07:25:36',
        mileage: '12.30', duration: 118
    });
    Object.assign(global.TASK_DETAIL_DATA['D04'], {
        actualStartTime: '2026-07-10 07:01:12', actualEndTime: '2026-07-10 08:28:54',
        mileage: '9.20', duration: 95
    });
    Object.assign(global.TASK_DETAIL_DATA['D05'], {
        actualStartTime: '2026-07-10 02:03:08', actualEndTime: '2026-07-10 04:12:30',
        mileage: '11.60', duration: 132
    });
    Object.assign(global.TASK_DETAIL_DATA['D06'], {
        actualStartTime: '2026-07-09 05:00:45', actualEndTime: '2026-07-09 07:05:18',
        mileage: '16.40', duration: 122
    });
    Object.assign(global.TASK_DETAIL_DATA['E-D01'], {
        actualStartTime: '2026-07-11 07:12:20', actualEndTime: '2026-07-11 08:05:42',
        mileage: '3.20', duration: 58
    });
    Object.assign(global.TASK_DETAIL_DATA['E-D02'], {
        actualStartTime: '2026-07-10 18:22:05', actualEndTime: '2026-07-10 19:42:18',
        mileage: '5.80', duration: 78
    });
    Object.assign(global.TASK_DETAIL_DATA['T-D01'], {
        actualStartTime: '2026-07-11 07:21:30', actualEndTime: '2026-07-11 07:56:48',
        mileage: '1.20', duration: 35
    });
    Object.assign(global.TASK_DETAIL_DATA['T-D02'], {
        actualStartTime: '2026-07-10 16:36:18', actualEndTime: '2026-07-10 17:21:42',
        mileage: '2.80', duration: 45
    });
    // 进行中任务：实际开始 + 当前里程 + 当前时长
    Object.assign(global.TASK_DETAIL_DATA['R01'], {
        actualStartTime: '2026-07-11 08:01:30',
        currentMileage: '12.50', currentDuration: 105
    });
    Object.assign(global.TASK_DETAIL_DATA['R02'], {
        actualStartTime: '2026-07-11 10:32:18',
        currentMileage: '7.30', currentDuration: 68
    });
    Object.assign(global.TASK_DETAIL_DATA['R03'], {
        actualStartTime: '2026-07-11 13:00:45',
        currentMileage: '4.80', currentDuration: 35
    });
    Object.assign(global.TASK_DETAIL_DATA['E-R01'], {
        actualStartTime: '2026-07-11 09:42:08',
        currentMileage: '3.60', currentDuration: 28
    });
    Object.assign(global.TASK_DETAIL_DATA['E-R02'], {
        actualStartTime: '2026-07-11 10:11:32',
        currentMileage: '5.20', currentDuration: 42
    });
    Object.assign(global.TASK_DETAIL_DATA['T-R01'], {
        actualStartTime: '2026-07-11 10:19:15',
        currentMileage: '1.80', currentDuration: 18
    });
    Object.assign(global.TASK_DETAIL_DATA['T-R02'], {
        actualStartTime: '2026-07-11 11:43:22',
        currentMileage: '2.40', currentDuration: 12
    });
}(window));
