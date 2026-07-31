(function (global) {
    'use strict';

    var records = [
        {
            id: 'P001', no: 'Q20260728-0014', taskId: 'I001', planDate: '2026-07-28',
            status: 'done', statusText: '已完成', currentNode: '已完成现场处置',
            location: '滨江路18号路口', reportedAt: '2026-07-28 09:18', coordinate: '113.9362, 22.5405',
            description: '路口东南侧人行道存在散落包装物，影响通行与环境卫生。',
            remark: '巡查时已上报环卫云，现场位置已标记。',
            handler: '王建国', handledAt: '2026-07-28 10:05',
            handleRemark: '已完成现场清理，复核后事件关闭。', photos: [], handledPhotos: []
        },
        {
            id: 'P002', no: 'Q20260728-0015', taskId: 'I002', planDate: '2026-07-28',
            status: 'pending', statusText: '待确认', currentNode: '待确认事件属性',
            location: '中央广场北门', reportedAt: '2026-07-28 10:26', coordinate: '113.9418, 22.5356',
            description: '广场北门绿化带外沿发现生活垃圾堆放，需要确认责任归属。',
            remark: '已同步定位信息，等待调度确认。',
            handler: '待分配', handledAt: '—', handleRemark: '事件待确认，暂未进入处置环节。', photos: [], handledPhotos: []
        },
        {
            id: 'P003', no: 'Q20260728-0016', taskId: 'I003', planDate: '2026-07-28',
            status: 'assigned', statusText: '待分配', currentNode: '待派发处置人员',
            location: '科技园南侧公交站', reportedAt: '2026-07-28 11:03', coordinate: '113.9294, 22.5481',
            description: '公交站旁果皮箱满溢，周边地面有零散纸屑。',
            remark: '已确认由市容保洁班组处置。',
            handler: '待派单', handledAt: '—', handleRemark: '调度中心正在分配处置人员。', photos: [], handledPhotos: []
        },
        {
            id: 'P004', no: 'Q20260728-0017', taskId: 'I003', planDate: '2026-07-28',
            status: 'processing', statusText: '待处理', currentNode: '环卫班组处理中',
            location: '创新大道与云杉路交叉口', reportedAt: '2026-07-28 11:42', coordinate: '113.9248, 22.5507',
            description: '非机动车道边缘存在落叶和淤积泥沙，雨后易造成路面湿滑。',
            remark: '保洁二班已接单，预计30分钟内完成。',
            handler: '赵敏', handledAt: '—', handleRemark: '正在现场清扫，待复核。', photos: [], handledPhotos: []
        },
        {
            id: 'P005', no: 'Q20260728-0018', taskId: 'I004', planDate: '2026-07-28',
            status: 'done', statusText: '已完成', currentNode: '已完成现场处置',
            location: '湖畔公园东入口', reportedAt: '2026-07-28 13:16', coordinate: '113.9486, 22.5279',
            description: '入口导视牌下方有小广告残留，影响环境观感。',
            remark: '已完成清除并检查周边设施。',
            handler: '陈浩', handledAt: '2026-07-28 13:46', handleRemark: '现场处理完成，图片复核通过。', photos: [], handledPhotos: []
        },
        {
            id: 'P006', no: 'Q20260729-0001', taskId: 'I005', planDate: '2026-07-29',
            status: 'assigned', statusText: '待分配', currentNode: '待派发处置人员',
            location: '兴业路东段', reportedAt: '2026-07-29 08:36', coordinate: '113.9173, 22.5432',
            description: '沿街商铺外侧发现共享单车无序停放，占用盲道。',
            remark: '需协调共享单车运维单位处理。',
            handler: '待派单', handledAt: '—', handleRemark: '待调度中心派发责任单位。', photos: [], handledPhotos: []
        },
        {
            id: 'P007', no: 'Q20260726-0021', taskId: 'I006', planDate: '2026-07-26',
            status: 'pending', statusText: '待确认', currentNode: '待确认事件属性',
            location: '文昌路社区西门', reportedAt: '2026-07-26 16:20', coordinate: '113.9561, 22.5324',
            description: '社区西门人行道砖面出现破损，需要确认是否纳入市政维修。',
            remark: '已标记破损区域，等待确认处置类别。',
            handler: '待分配', handledAt: '—', handleRemark: '事件待确认，暂未进入处置环节。', photos: [], handledPhotos: []
        },
        {
            id: 'P008', no: 'Q20260724-0012', taskId: 'I007', planDate: '2026-07-24',
            status: 'processing', statusText: '待处理', currentNode: '市政维修队处理中',
            location: '高新一路人行天桥下', reportedAt: '2026-07-24 14:08', coordinate: '113.9387, 22.5591',
            description: '天桥下雨水篦子周边有杂物堵塞，降雨时存在积水隐患。',
            remark: '市政维修队已勘察，安排清掏作业。',
            handler: '刘晨', handledAt: '—', handleRemark: '现场正在清掏，等待处理结果回传。', photos: [], handledPhotos: []
        },
        {
            id: 'P009', no: 'Q20260722-0008', taskId: 'I008', planDate: '2026-07-22',
            status: 'done', statusText: '已完成', currentNode: '已完成现场处置',
            location: '创业路与景观大道交叉口', reportedAt: '2026-07-22 09:52', coordinate: '113.9136, 22.5522',
            description: '路口隔离栏反光贴破损，夜间辨识度下降。',
            remark: '已更换破损反光贴并完成安全检查。',
            handler: '周倩', handledAt: '2026-07-22 11:18', handleRemark: '更换完成，复核通过后关闭事件。', photos: [], handledPhotos: []
        }
    ];

    var byId = {};
    records.forEach(function (item) { byId[item.id] = item; });
    global.INSPECTION_PROBLEM_RECORDS = records;
    global.INSPECTION_PROBLEM_BY_ID = byId;
}(window));
