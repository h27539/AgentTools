//punchs页面用（native也要用）
var networkType = 'noting';
$(function () {
    if(wxjsinfo) {
        wx.ready(function () {
            wx.hideAllNonBaseMenuItem();
        });
        wx.config(wxjsinfo);
        setTimeout('getgpsfirst()', 1850);//先首次尝试获取位置
    }
    setInterval('countdown()', 3000);
});

function scanqr() {
    wx.scanQRCode();
}

function punch_click(_id) {
    $("#punch_click_form_" + _id).submit();
}

function punch_pwd(_id) {

    _pwd = prompt("输入签到密码", "");
    if (typeof (_pwd) == 'undefined' || _pwd.trim().length == 0)
        return;
    $("#punch_pwd_form_" + _id).find("[name=pwd]").val(_pwd);
    $("#punch_pwd_form_" + _id).submit();
}

function punch_qr(_id) {
    $("#punch_qr_form_" + _id).submit();
}


var global_punch_id = -1;

function punch_gps_photo(_id, _prule) {

    if (window.navigator.userAgent.toLowerCase().match(/MicroMessenger/i) != 'micromessenger') {
        alert('只能在微信中完成');
        return;
    }

    global_punch_id = _id;
    layer.open({
        type: 1,
        title: 'GPS考勤',
        content: '<div style="text-align:center;padding:15px;"><p>' + _prule + '<br><span id="wx_photoed">（未上传）</span></p><p style="margin:10px 0"><button class="layui-btn layui-btn-normal" onclick="wx_camera_photo(punch_gps_photo_ok)">拍照上传</button></p><p><button class="layui-btn" onclick="punch_gps_photo_sumit(' + _id + ')">确认考勤</button></p></div>'
    });
}

function punch_gps_photo_ok(_wx_reslocalid, _wx_resserverid) {

    //处理一下缩略图

    wx.getLocalImgData({
        localId: _wx_reslocalid,
        success: function (res) {
            var _lcdata = res.localData;
            if(_lcdata.substr(0,5)!='data:')
                _lcdata = 'data:image/jpg;base64,'+_lcdata;
            $('#wx_photoed').html('<img src="' + _lcdata + '" width="100">');
        }
    });


    //$('#wx_photoed').html('已上传');
    //punch_gps_photo_sumit(global_punch_id);//需要自动提交吗
}

function punch_gps_photo_sumit(_id) {
    if (wx_photo_serverids.length == 0) {
        alert("需要先上传照片");
        wx_camera_photo(punch_gps_photo_ok);
        return;
    }

    $("#punch_gps_res_" + _id).val(JSON.stringify(wx_photo_serverids));

    punch_gps(_id);
}

function punch_gps(_id) {

    // if (window.navigator.userAgent.toLowerCase().match(/MicroMessenger/i) != 'micromessenger') {
    //     alert('只能在微信中完成');
    //     return;
    // }

    wx.getNetworkType({
        success: function (res) {
            networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
        }
    });


    ret = wx.getLocation({
        type: 'gcj02',
        success: function (res) {
            if ($("#punch_gps_inrange_" + _id).val() == '1') {
                rangArray = eval('(' + $("#punch_gps_ranges_" + _id).val() + ')');
                _dstc = geoDistance2Ranges(res.latitude, res.longitude, rangArray);
                if (_dstc > 0) {
                    return layer.alert('不在位置范围内，无法完成签到<br><br>离圈还有' + _dstc + '米，如果定位不准确，可尝试开GPS、开WIFI、移动到空旷位置等操作后重新尝试');
                }
            }
            //res.speed; // 速度，以米/每秒计//风险处理：后台会加入其他数据进行效验数据真实性
            $("#punch_gps_lat_" + _id).val(res.latitude);
            $("#punch_gps_lng_" + _id).val(res.longitude);
            $("#punch_gps_acc_" + _id).val(res.accuracy);
            $("#punch_gps_form_" + _id).submit();
        },
        fail: function (res)//接口调用失败时执行的回调函数。
        {
            if (networkType != 'wifi')
                layer.msg("获取位置失败（" + JSON.stringify(res) + "），可打开WIFI和定位后再尝试");
            else
                layer.msg("获取位置失败（" + JSON.stringify(res) + "），可进行以下操作后再尝试：打开手机定位和授权微信定位权限");
        },
        complete: function (res)//接口调用完成时执行的回调函数，无论成功或失败都会执行。
        {
            //console.log('complete');
            //$("#punch_gps_form_"+_id).submit();
        },
        cancel: function (res)//用户点击取消时的回调函数，仅部分有用户取消操作的api才会用到。
        {
            //console.log('cancel');
            alert("请重试，需要点允许获取才能继续签到操作");
        }
    });

}

function countdown() {
    $('.countdown').each(function (_i, _v) {
        _ct = parseInt($(_v).attr('ct'));
        _ct = _ct - 3;
        $(_v).attr('ct', _ct);
        if (_ct > 60)
            _s = (parseInt(_ct / 60) + 1) + '分钟后';
        else if (_ct > 0)
            _s = (_ct + 30) + '秒后';
        else
            _s = '已';
        $(_v).html(_s);
    });
}

function getgpsfirst() {

    wx.getNetworkType({
        success: function (res) {
            networkType = res.networkType; // 返回网络类型2g，3g，4g，wifi
        }
    });
    ret = wx.getLocation({
        type: 'gcj02',//'wgs84',
        success: function (res) {
            $("[name='lat']").val(res.latitude);
            $("[name='lng']").val(res.longitude);
        },
        fail: function (res)//接口调用失败时执行的回调函数。
        {
            if (networkType != 'wifi')
                layer.msg("获取位置失败（" + JSON.stringify(res) + "），可打开WIFI和定位后再尝试");
            else
                //console.log('fail');
                layer.msg("获取位置失败（" + JSON.stringify(res) + "），可进行以下操作后再尝试：打开手机定位和授权微信定位权限");
        },
        complete: function (res)//接口调用完成时执行的回调函数，无论成功或失败都会执行。
        {
            console.log('complete');
            //$("#punch_gps_form_"+_id).submit();
        },
        cancel: function (res)//用户点击取消时的回调函数，仅部分有用户取消操作的api才会用到。
        {
            console.log('cancel');
            layer.msg("已取消，如果需要获取，还可以点上方“自动获取位置”按钮重试");
        }
    });

}