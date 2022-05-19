---
layout: post
filename: unraid-guan-fang-ban-bu-xiu-gai-bu-yong-keymaker-ke-chi-xu-happy-de-fang-fa
title: unraid 官方版不修改不用 keymaker 可持续 happy 的方法
categories:
  - code
description: LD_PRELOAD 听说过么
keywords: unraid, keymaker, happy, offical
---
### 前言

1. 文章里的讨论仅限于技术交流，如有需要请 [**购买正版**](https://unraid.net/pricing) ！！！
2. 文章里的讨论仅限于技术交流，如有需要请 [**购买正版**](https://unraid.net/pricing) ！！
3. 文章里的讨论仅限于技术交流，如有需要请 [**购买正版**](https://unraid.net/pricing) ！
4. 请勿分发二进制！！！



### 原理

1. `emhttpd` 使用 `RSA_public_decrypt` 去解析 `BTRS.key`，里面是你的注册信息
2. 将信息写入 `var/state.ini`，这样其他人就可以拿到

### 思路

1. `LD_PRELOAD` 拦截 `RSA_public_decrypt` 函数，做自定义替换

### 使用方法

> 注意：我在 `Slackware` 上编译的，为的是不理会那些编译环境造成的问题

1. 把源码编译一下：`gcc -fPIC -shared unraid.c -o BTRS.key`，至于名字为什么是 `BTRS.key`，因为反正这个文件也没什么用了，不如就少个文件少点事情
2. 编译好的 `BTRS.key` 文件放到 `/boot/config/BTRS.key`
3. 修改一下启动配置文件 `/boot/config/go`，把

```shell
/usr/local/sbin/emhttp &
```

替换成

```shell
export UNRAID_GUID=你优盘的GUID
export UNRAID_NAME=你的名字
export UNRAID_DATE=一个UNIX时间戳
export UNRAID_VERSION=你想要开心的版本比如Pro
LD_PRELOAD=/boot/config/BTRS.key /usr/local/sbin/emhttp &
```

### 效果

> 写这份代码时，版本是 `6.9.2`，顺手测试了一下 `6.10.0-rc3` 也是能用的，就贴个图吧
>
> ![](/uploads/unraid_happy.png)

### 代码

```c
#define _GNU_SOURCE
#include <stdio.h>
#include <fcntl.h>
#include <dlfcn.h>
#include <unistd.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <sys/uio.h>
#include <netinet/in.h>

#define RSA void
#define BTRS_FORMAT "regGUID=%s&regTy=%s&regTo=\"%s\"&regTm=%s&regGen=0&regDays=0"

typedef int (*RSA_PUBLIC_DECRYPT_FUNC)(int flen, unsigned char *from, unsigned char *to, RSA *rsa, int padding);
RSA_PUBLIC_DECRYPT_FUNC rsa_public_decrypt;

const char* get_self_exe_name(int full) {
  static char buffer[4096] = "";
  readlink("/proc/self/exe", buffer, 4096);
  if (full) {
    return buffer;
  }
  char* ptr = &buffer[strlen(buffer)];
  while (*ptr != '/') --ptr;
  return (ptr + 1);
}

int RSA_public_decrypt(int flen, unsigned char *from, unsigned char *to, RSA *rsa, int padding) {
  if (!rsa_public_decrypt) {
    rsa_public_decrypt = (RSA_PUBLIC_DECRYPT_FUNC)dlsym(RTLD_NEXT, "RSA_public_decrypt");
  }
  if (!strcmp(get_self_exe_name(0), "emhttpd") || !strcmp(get_self_exe_name(0), "shfs")) {
    sprintf(to, BTRS_FORMAT, getenv("UNRAID_GUID"), getenv("UNRAID_VERSION"), getenv("UNRAID_NAME"), getenv("UNRAID_DATE"));
    int len = strlen(to);
    return len;
  } else {
    return rsa_public_decrypt(flen, from, to, rsa, padding);
  }
}
```