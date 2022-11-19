---
layout: post
filename: unRAID-6.11.4-ru-he-ji-xu-kai-xin
title: unRAID 6.11.4 如何继续开心
categories:
  - code
description: 增加了函数 offset 间校验防止 hook，呵呵
keywords: unraid, 6.11.4, happy
---
### 简单说

1. 增加了校验，使用两个函数的 `offset` 判断是否被劫持，我倒是人为可以构造出来，但是 `offset` 可能在不同版本间会变化，所以放弃这种方式
2. 给劫持函数的逻辑增加 `jmp` 可以绕过，所以找了个库 `subhook` 轻松搞定
3. 以上经过验证可以使用，先更新二进制，再升级版本可无缝，但是大家用正版吧还是 2333

### 一些截图

![](/uploads/screenshot-20221119-164722.png)

![](/uploads/photo_2022-11-19-16.48.09.jpeg)