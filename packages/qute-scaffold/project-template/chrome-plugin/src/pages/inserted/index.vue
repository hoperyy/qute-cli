<template>
    <div>
        
    </div>
</template>

<script>
import $ from 'jquery';
import globalData from '../../common/global';

export default {
    data() {
        return {
            
        };
    },
    mounted() {
        window.addEventListener('message', (event) => {
            const action = event.data;
        }, false);
    },
    methods: {
        
    }
}
</script>

<style lang="less" scoped>

</style>