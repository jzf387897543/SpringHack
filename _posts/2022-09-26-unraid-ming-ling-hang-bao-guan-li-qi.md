---
layout: post
filename: unraid-ming-ling-hang-bao-guan-li-qi
title: unraid 命令行包管理器
categories:
  - code
description: 因为每次升级完新版本都要等 nerdtool 升级太痛苦了...
keywords: unraid, package manager, spkg, nerdtool
---
### Usage

> 就一个命令 `spkg`，非常简单

```bash
spkg search vim
spkg install vim
spkg remove vim
spkg list vim
spkg help
```

### Code

> 代码随手贴一下，因为就临时手撕的所以很多逻辑违反人性，比如一次只能安装一个包(如果多个 `match` 就是靠前的包)，不能自行装依赖等

```bash
#!/bin/bash

BASE_URL="https://mirrors.aliyun.com/slackware/slackware64-current"
PKGS_URL="https://mirrors.slackware.com/slackware/slackware64-current"
LIST_URL="$BASE_URL/slackware64/PACKAGES.TXT"

if ! [ -f /tmp/spkg.list ];
then
  curl -fsSL "$LIST_URL" -o /tmp/spkg.list
fi

opt="$1"
pkg="$2"
mkdir -p /boot/extra

usage() {
  cat << EOF
Usage:
  spkg [OPERATION] [PACKAGE_NAME]
    OPERATION: search/install/remove/list/help
EOF
}

case $opt in
  search)
    cat /tmp/spkg.list | grep -ni "PACKAGE NAME:.*$pkg" | awk '{print $3}'
    ;;
  install)
    name=$(cat /tmp/spkg.list | grep -ni "PACKAGE NAME:.*$pkg" | head -n1 | awk '{print $3}')
    name_line=$(cat /tmp/spkg.list | grep -ni "PACKAGE NAME:.*$pkg" | head -n1 |  awk -F: '{print $1}')
    dir_line=$(( $name_line + 1 ))
    dir=$(cat /tmp/spkg.list | sed -n "${dir_line}p" | awk '{print $3}')
    url="${PKGS_URL}/${dir}/${name}"
    wget -4 "$url" -O /boot/extra/${name}
    installpkg /boot/extra/${name}
    ;;
  remove)
    removepkg $pkg
    for file in $(find /boot/extra -type f -name "$pkg*");
    do
      rm $file
    done
    ;;
  list)
    ls /var/log/packages/ | grep "$pkg"
    ;;
  *)
    echo 'no such operation'
    usage
    ;;
esac

exit 0
```
