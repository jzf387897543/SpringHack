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

REPO_VERS="slackware64"
REPO_NAME=(
  "slackware"
  "conraid"
)
declare -A REPO_URLS=(
  ["slackware"]="https://mirrors.slackware.com/slackware/slackware64-current"
  ["conraid"]="https://slack.conraid.net/repository/slackware64-current"
)

opt="$1"
shift
pkgs_list="$@"
mkdir -p /boot/extra

log() {
  eol=${4:-"\n"}
  echo -n -e "$1\033[0;35m[$2]\033[0m $3$eol" 1>&2
}

usage() {
  cat << EOF
Usage:
  spkg [OPERATION] [PACKAGE_NAME...]
    OPERATION: update/upgrade/search/install/remove/list/help
EOF
}

ensure_update() {
  cached="yes"
  for repo in "${REPO_NAME[@]}";
  do
    if ! [ -f /tmp/spkg.d/${repo}.list ];
    then
      cached="no"
    fi
  done
  if [ "$cached" != "yes" ];
  then
    log '' '*' 'No repo cache in local, need run update first !'
    exit -2
  fi
}

case $opt in
  update)
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Update repo ..."
    rm -rvf /tmp/spkg.d >/dev/null 2>&1
    mkdir -p /tmp/spkg.d
    for repo in "${REPO_NAME[@]}";
    do
      repo_pkgs_url="${REPO_URLS[$repo]}/PACKAGES.TXT"
      echo "update repo($repo) url($repo_pkgs_url) ..."
      curl -fSL --progress-bar "$repo_pkgs_url" -o /tmp/spkg.d/$repo.list
    done
    echo "DONE !"
    ;;
  search)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Search repo ..."
    for pkg in $pkgs_list;
    do
      echo "search pkg($pkg) ..."
      cat /tmp/spkg.d/*.list | grep -ni "PACKAGE NAME:  $pkg" | awk '{print $3}'
    done
    ;;
  install)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Install packages: ${pkgs_list} ..."
    for pkg in $pkgs_list;
    do
      grep_command="grep -niH 'PACKAGE NAME:  ${pkg}'"
      for repo in "${REPO_NAME[@]}";
      do
        grep_command="$grep_command /tmp/spkg.d/${repo}.list"
      done
      info="$(eval "$grep_command" | head -n1)"
      repo=$(basename $(awk -F: '{print $1}' <<< "$info") .list)
      line="$(awk -F: '{print $2}' <<< "${info}")"
      name="$(awk '{print $3}' <<< "${info}")"
      location="$(tail +${line} /tmp/spkg.d/${repo}.list | grep "PACKAGE LOCATION" | head -n1 | awk '{print $3}')"
      file_url="${REPO_URLS[$repo]}/$location/$name"
      file_url="${file_url/\.\//}"
      log '' '<=>' "Download pkg($name) in repo($repo) with url($file_url) ..."
      curl -fSL --progress-bar "$file_url" -o /boot/extra/${name}
      log '' '<=>' "Install pkg($name) in repo($repo) with url($file_url) ..."
      installpkg /boot/extra/${name}
      log '' '***' "Package $name installed !"
    done
    ;;
  remove)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Remove packages: ${pkgs_list} ..."
    for pkg in $pkgs_list;
    do
      removepkg $pkg
      for file in $(find /boot/extra -type f -name "$pkg*");
      do
        rm $file
      done
    done
    ;;
  upgrade)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "Upgrade packages: ${pkgs_list} ..."
    "$0" remove $pkgs_list
    "$0" install $pkgs_list
    ;;
  list)
    ensure_update
    log '' $(tr 'a-z' 'A-Z' <<< $opt) "List packages: ${pkgs_list} ..."
    ls /var/log/packages/ | grep "$pkg"
    ;;
  *)
    log '' '*' 'No such operation !'
    usage
    exit -1
    ;;
esac

exit 0
```
