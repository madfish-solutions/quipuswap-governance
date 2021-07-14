# Rapid tests for Quipuswap

Engaging Michelson interpreter to quickly check math soundness for Quipuswap.
Powered by PyTezos.

## Prerequisites

Install cryptographic libraries according to your system following the instrucitons here:
https://pytezos.org/quick_start.html#requirements

## Installation

```
python3 -m pip install pytezos
./integration_tests/build_dex.sh
```

## Usage
From the root folder
```
python3 -m pytest . -v -s
```
