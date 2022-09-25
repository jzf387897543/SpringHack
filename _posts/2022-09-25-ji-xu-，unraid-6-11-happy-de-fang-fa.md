---
layout: post
filename: unraid-6.11.0-happy
title: 继续，unraid 6.11 happy 的方法
categories:
  - code
description: LD_PRELOAD 方法失效了，不过其他方法有很多
keywords: unraid, 6.11.0, happy, crack
---
### Notice

* 请用正版！！！
* 请用正版！！
* 请用正版！

### Update

* 我删除了关键的信息，因为我们还是需要支持正版
* 文章里描述的信息仅作为技术交流使用，有能力的朋友还是需要自己研究

### Usage

> 这次我就不放代码了，和以前一样，差别是两点，有能力者自己动手

1. 这次新增了密钥文件检查，所以需要有一个 *合法* 的密钥存在，具体细节可以自行反汇编查看
2. `LD_PRELOAD` 失效，`go` 里面 `LD_PRELOAD` 这个变量可以删了，需要用别的方法注入逻辑

### Screenshot

![](/uploads/unraid_crack.png "unraid 6.11.0 happy")