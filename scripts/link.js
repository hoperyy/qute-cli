"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const childProcess = __importStar(require("child_process"));
const config = {
    'qute-cli': ['qute-cli-util'],
    'qute-cli-core': ['qute-cli-util'],
};
const lernaPath = path.join(__dirname, '../node_modules/.bin/lerna');
Object.keys(config).forEach(key => {
    const valArr = config[key];
    // lerna add qute-cli-core --scope=qute-cli-util
    valArr.forEach(dep => {
        try {
            console.log(`${lernaPath} add ${dep} --scope=${key}`);
            childProcess.execSync(`${lernaPath} add ${dep} --scope=${key}`, { stdio: 'inherit' });
        }
        catch (err) {
            console.log('error when: ', `${lernaPath} add ${dep} --scope=${key}`);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpbmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsMkNBQTRCO0FBQzVCLDREQUE2QztBQUU3QyxNQUFNLE1BQU0sR0FBRztJQUNYLFVBQVUsRUFBRSxDQUFDLGVBQWUsQ0FBQztJQUM3QixlQUFlLEVBQUUsQ0FBQyxlQUFlLENBQUM7Q0FDckMsQ0FBQTtBQUVELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDRCQUE0QixDQUFDLENBQUE7QUFFcEUsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDOUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBRTFCLGdEQUFnRDtJQUNoRCxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ2pCLElBQUk7WUFDQSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUyxRQUFRLEdBQUcsWUFBWSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3RELFlBQVksQ0FBQyxRQUFRLENBQUMsR0FBRyxTQUFTLFFBQVEsR0FBRyxZQUFZLEdBQUcsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUE7U0FDeEY7UUFBQyxPQUFNLEdBQUcsRUFBRTtZQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLEdBQUcsU0FBUyxRQUFRLEdBQUcsWUFBWSxHQUFHLEVBQUUsQ0FBQyxDQUFBO1NBQ3hFO0lBQ0wsQ0FBQyxDQUFDLENBQUE7QUFDTixDQUFDLENBQUMsQ0FBQSJ9