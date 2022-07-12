---
layout: post
filename: dai-ma-geng-xin-，happy-unraid-lan-ren-ban
title: 代码更新，happy unraid 懒人版
categories:
  - code
description: 就是不想去自己取 uuid 了，太麻烦，其他位置不变
keywords: unraid
---
### 继续警戒

1. 文章里的讨论仅限于技术交流，如有需要请 购买正版 ！！！
2. 文章里的讨论仅限于技术交流，如有需要请 购买正版 ！！
3. 文章里的讨论仅限于技术交流，如有需要请 购买正版 ！
4. 请勿分发二进制，注意到最近有二进制在流传，和本人无关 ！！

### 主要变化

> `UNRAID_UUID` 这个变量可以不要了，当然如果测试下来不生效，继续写也是 ok 的

> 前文回顾：[unraid 官方版不修改不用 keymaker 可持续 happy 的方法](https://www.dosk.win/2022/03/11/unraid-guan-bu-xiu-gai-bu-yong-keymaker-ke-chi-xu-happy-de-fang-fa/)

> 由此程序引发的各类后果本人概不承担

### 代码

> 编译：`gcc -fPIC -shared udev.c -ludev -ldl -o BTRS.key`

```c
#define _GNU_SOURCE
#include <dlfcn.h>
#include <fcntl.h>
#include <libudev.h>
#include <netinet/in.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/uio.h>
#include <unistd.h>

#define RSA void
#define DISK_LABEL "UNRAID"
#define BTRS_FORMAT \
  "regGUID=%s&regTy=%s&regTo=\"%s\"&regTm=%s&regGen=0&regDays=0"

typedef int (*RSA_PUBLIC_DECRYPT_FUNC)(int flen, unsigned char* from,
                                       unsigned char* to, RSA* rsa,
                                       int padding);

static char* unraid_uuid = NULL;
static char* unraid_name = NULL;
static char* unraid_date = NULL;
static char* unraid_version = NULL;
RSA_PUBLIC_DECRYPT_FUNC rsa_public_decrypt;

int get_dev_path(char* buffer, size_t size);
int get_usb_device(char* buffer, size_t size);
int get_serial_string(char* buffer, size_t size);
void read_file(char* buff_ptr, char* base_ptr, char* file_ptr, char* file);

__attribute__((constructor)) void unraid_init() {
  if (!rsa_public_decrypt) {
    rsa_public_decrypt =
        (RSA_PUBLIC_DECRYPT_FUNC)dlsym(RTLD_NEXT, "RSA_public_decrypt");
  }

  if (!unraid_uuid) {
    unraid_uuid = (char*)malloc(1024);
    strcpy(unraid_uuid, "1234-1234-1234-1234567890AB");
    int err = get_serial_string(unraid_uuid, 1024);
    if (err && getenv("UNRAID_UUID")) {
      strcpy(unraid_uuid, getenv("UNRAID_UUID"));
    }
    unraid_name = getenv("UNRAID_NAME");
    unraid_date = getenv("UNRAID_DATE");
    unraid_version = getenv("UNRAID_VERSION");
  }
}

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

int RSA_public_decrypt(int flen, unsigned char* from, unsigned char* to,
                       RSA* rsa, int padding) {
  if (!strcmp(get_self_exe_name(0), "emhttpd") ||
      !strcmp(get_self_exe_name(0), "shfs")) {
    sprintf(to, BTRS_FORMAT, unraid_uuid, unraid_version, unraid_name,
            unraid_date);
    int len = strlen(to);
    return len;
  } else {
    return rsa_public_decrypt(flen, from, to, rsa, padding);
  }
}

/**** udev stuff ****/
int get_dev_path(char* buffer, size_t size) {
  char link_device[1024];
  char real_device[1024];

  sprintf(link_device, "/dev/disk/by-label/%s", DISK_LABEL);
  char* rv = realpath(link_device, real_device);
  if (!rv) return 2;

  struct udev* udev;
  struct udev_device* dev;
  struct udev_enumerate* enumerate;
  struct udev_list_entry *devices, *dev_list_entry;

  int find = -1;

  udev = udev_new();
  if (!udev) {
    return 1;
  }

  enumerate = udev_enumerate_new(udev);
  if (!enumerate) {
    return 1;
  }

  udev_enumerate_add_match_subsystem(enumerate, "block");
  udev_enumerate_scan_devices(enumerate);

  devices = udev_enumerate_get_list_entry(enumerate);
  if (!devices) {
    return 1;
  }

  udev_list_entry_foreach(dev_list_entry, devices) {
    const char *path, *tmp;
    unsigned long long disk_size = 0;

    path = udev_list_entry_get_name(dev_list_entry);
    dev = udev_device_new_from_syspath(udev, path);

    if (strncmp(udev_device_get_devtype(dev), "partition", 9) != 0 &&
        strncmp(udev_device_get_sysname(dev), "loop", 4) != 0) {
      const char* devnode = udev_device_get_devnode(dev);
      char* ptr = strstr(real_device, devnode);
      if (ptr && ptr == real_device) {  // prefix
        find = 0;
        strcpy(buffer, udev_device_get_devpath(dev));
      }
    }

    udev_device_unref(dev);
  }

  udev_enumerate_unref(enumerate);
  udev_unref(udev);

  return find;
}

int get_usb_device(char* buffer, size_t size) {
  char dev_path[1024];
  if (get_dev_path(dev_path, 1024)) {
    return 2;
  }

  int slash_index[1024];
  int slash_count = 0;
  for (int i = 0; i < strlen(dev_path); ++i) {
    if (dev_path[i] == '/') {
      slash_index[slash_count++] = i;
    }
  }

  int find = -1;
  for (int i = slash_count - 1; i >= 0; --i) {
    char usb_device[1024] = "/sys";
    strcpy(&dev_path[slash_index[i]], "/serial");
    strcat(usb_device, dev_path);
    if (!access(usb_device, F_OK | R_OK)) {
      strcpy(buffer, usb_device);
      buffer[strlen(buffer) - strlen("/serial")] = '\0';
      find = 0;
      break;
    }
  }

  return find;
}

void read_file(char* buff_ptr, char* base_ptr, char* file_ptr, char* file) {
  strcpy(file_ptr, file);
  FILE* fp = fopen(base_ptr, "r");
  fscanf(fp, "%s", buff_ptr);
  fclose(fp);
}

int get_serial_string(char* buffer, size_t size) {
  char usb_device[1024];
  if (get_usb_device(usb_device, 1024)) {
    return 2;
  }

  char* file_ptr = &usb_device[strlen(usb_device)];
  char* buff_ptr = buffer;

  read_file(buff_ptr, usb_device, file_ptr, "/idVendor");
  strcat(buff_ptr, "-");
  buff_ptr += strlen(buff_ptr);

  read_file(buff_ptr, usb_device, file_ptr, "/idProduct");
  strcat(buff_ptr, "-");
  buff_ptr += strlen(buff_ptr);

  char serial_buffer[1024];
  read_file(serial_buffer, usb_device, file_ptr, "/serial");
  strcpy(buff_ptr, serial_buffer);
  *(buff_ptr + 4) = '-';
  strcpy(buff_ptr + 5, &serial_buffer[4]);

  int offset = 'A' - 'a';
  for (int i = 0; i < strlen(buffer); ++i) {
    if (buffer[i] >= 'a' && buffer[i] <= 'z') {
      buffer[i] += offset;
    }
  }

  return 0;
}

int main() {
  char serial[1024];
  int err = get_serial_string(serial, 1024);
  if (!err) {
    printf("SERIAL: %s\n", serial);
  }
  return 0;
}
```