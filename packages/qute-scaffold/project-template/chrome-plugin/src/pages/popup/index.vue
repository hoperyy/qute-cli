<template>
    <div class="page">
        <div v-if="gettingPermission" class="permission">
            <div class="permission_content">
                正在获取使用权限
            </div>
        </div>
        <template v-else>
            <div v-if="!permissionAllow" class="permission">
                <div class="permission_content">
                    当前网络环境无法使用该插件
                </div>
            </div>
            <div v-else>
                <div class="feedback">
                    <a href="https://github.com/hoperyy" target="_blank">contact mantainer</a>
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import utils from '../../common/utils';
import globalData from '../../common/global';
import config from '../../common/config';

const LS_STATUS_KEY = 'weidian-power-status';

export default {
    data() {
        return {
            gettingPermission: true,
            permissionAllow: false,
        }
    },
    watch: {
        
    },
    methods: {
        checkPermission() {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = '';
                img.onload = () => {
                    resolve(true);
                };
                img.onerror = () => {
                    resolve(false);
                };
            });
        },
    },
    async mounted() {
        this.gettingPermission = true;
        this.permissionAllow = await this.checkPermission();
        this.gettingPermission = false;
    }
}
</script>

