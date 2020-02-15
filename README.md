# bjut-vpn-connector
 ![](https://img.shields.io/static/v1?label=&message=chrome%20extension&color=blue) ![](https://img.shields.io/static/v1?label=status&message=not%20finished&color=red) ![](https://img.shields.io/static/v1?label=version&message=internal&color=blue) ![](https://img.shields.io/github/license/Woodykaixa/bjut-vpn-connector)
 
用于连接北京工业大学vpn的Chrome扩展

## 介绍
众所周知，2020年，就连Microsoft Edge也换成Chromium内核了，而我校vpn还在使用ie登录。新版Edge不像旧版有一个使用IE打开的选项，所以我写了这个扩展用于连接BJUT的vpn。

## 目前进度
目前只能访问教务,my.bjut.edu.cn怎么连接还没研究明白。

## 安装本扩展

### 安装要求
本扩展可以安装在Google Chrome浏览器以及Chromium内核浏览器（比如新版Edge以及一众国产浏览器）但是国产浏览器一般都有IE内核，直接访问vpn.bjut.edu.cn是不是没问题？我没试过）(那这个插件好像就没用了)

### 安装方法
1. 运行`npm run pack`打包生成js文件。
2. ![](./readme_img/readme01.png)

3. ![](readme_img/readme02.png)

## 如何使用
点击浏览器地址栏右侧图标（深色主题下可能看不清，鼠标移上去会有提示），然后输入学号和校园网密码，点击连接。
![](readme_img/readme03.png)
插件上显示已连接，则可以使用。

## 版权许可
MIT
