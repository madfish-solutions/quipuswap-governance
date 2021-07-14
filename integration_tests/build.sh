#!/bin/sh

mkdir contracts/compiled
ligo compile-contract contracts/main/Governance.ligo main > contracts/compiled/Governance.tz
