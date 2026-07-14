(function (global) {
    'use strict';

    var STORAGE_KEY = 'kuwash-today-vehicle-binding';
    var DEFAULT_VEHICLE = {
        vehicleId: 'VH20260710001',
        plateNo: '粤B·D2856',
        vehicleType: '洗扫车'
    };

    function getBinding() {
        try {
            var raw = global.sessionStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    function bind(vehicle) {
        var binding = Object.assign({}, DEFAULT_VEHICLE, vehicle || {}, {
            boundAt: Date.now()
        });
        global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(binding));
        return binding;
    }

    function unbind() {
        global.sessionStorage.removeItem(STORAGE_KEY);
    }

    global.VehicleDemoState = {
        defaultVehicle: DEFAULT_VEHICLE,
        getBinding: getBinding,
        isBound: function () { return Boolean(getBinding()); },
        bind: bind,
        unbind: unbind
    };
})(window);
