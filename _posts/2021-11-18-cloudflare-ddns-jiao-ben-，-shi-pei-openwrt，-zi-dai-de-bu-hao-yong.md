---
layout: post
filename: Cloudflare-DDNS-jiao-ben-，-shi-pei-OpenWrt，-zi-dai-de-bu-hao-yong
title: Cloudflare DDNS 脚本，适配 OpenWrt，自带的不好用
categories:
  - code
description: 需要搭配 crontab 一起用
---
```shell
#!/bin/ash

# Base env
export PATH='/usr/sbin:/usr/bin:/sbin:/bin'

# Params
API_TOKEN='XXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
API_TARGET_DOMAIN='wtf_sub_domain.dosk.win'
API_ROOT_DOMAIN='dosk.win'

# Runtime params
IP4="$(ifstatus wan | jsonfilter -e '@["ipv4-address"][0].address')"
IP6="$(ifstatus wan6 | jsonfilter -e '@["ipv6-address"][0].address')"

# Functions
base_request() {
  API="$1"
  curl -s \
    -X GET "https://api.cloudflare.com/client/v4/$API" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type:application/json"
}

base_update() {
  API="$1"
  DATA="$2"
  curl -s \
    -X PUT "https://api.cloudflare.com/client/v4/$API" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type:application/json" \
    --data "$DATA"
}

ddns_log() {
  echo "$@"
}

# Main
ddns_log 'Get domain zone id ...'
sleep 1
zone_id="$(base_request "zones?name=$API_ROOT_DOMAIN" | jsonfilter -e '@["result"][0].id')"

ddns_log 'Get IPv4 domain record info ...'
sleep 1
v4_info="$(base_request "zones/$zone_id/dns_records?name=$API_TARGET_DOMAIN&type=A")"
v4_record_id="$(echo $v4_info | jsonfilter -e '@["result"][0].id')"
v4_record_ip="$(echo $v4_info | jsonfilter -e '@["result"][0].content')"

ddns_log 'Get IPv6 domain record info ...'
sleep 1
v6_info="$(base_request "zones/$zone_id/dns_records?name=$API_TARGET_DOMAIN&type=AAAA")"
v6_record_id="$(echo $v6_info | jsonfilter -e '@["result"][0].id')"
v6_record_ip="$(echo $v6_info | jsonfilter -e '@["result"][0].content')"

ddns_log 'Info summary ...'
ddns_log "IPv4 - $v4_record_id: from $v4_record_ip to $IP4"
ddns_log "IPv6 - $v6_record_id: from $v6_record_ip to $IP6"

if [ "$IP4" != "$v4_record_ip" ];
then
  ddns_log 'Do update IPv4 ...'
  base_update "zones/$zone_id/dns_records/$v4_record_id" "{\"type\":\"A\",\"name\":\"$API_TARGET_DOMAIN\",\"content\":\"$IP4\",\"ttl\":1}" | jsonfilter -e '@["success"]'
fi

if [ "$IP4" != "$v4_record_ip" ];
then
  ddns_log 'Do update IPv6 ...'
  base_update "zones/$zone_id/dns_records/$v6_record_id" "{\"type\":\"AAAA\",\"name\":\"$API_TARGET_DOMAIN\",\"content\":\"$IP6\",\"ttl\":1}" | jsonfilter -e '@["success"]'
fi

ddns_log 'All done !'
```
