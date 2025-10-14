# xR2 Python SDK: Publish, Update, Test

This guide shows how to publish, update, and test the Python SDK for xR2.

Note: The SDK uses a PEP 517 `pyproject.toml` build. Ensure it exists (e.g., in `sdk/pyproject.toml`) with `name = "xr2-sdk"` and your package code under `sdk/xr2_sdk/`.

## 1) Local Dev & Testing

- Create/activate venv:
```
python3 -m venv .venv
source .venv/bin/activate
```
- Install build tools and the package in editable mode:
```
pip install --upgrade pip build twine
pip install -e ./sdk
```
- Run a quick import test:
```python
python -c "from xr2_sdk.client import xR2Client; print('ok')"
```
- Optionally run example scripts:
```
python sdk/examples/basic_sync.py
python sdk/examples/basic_async.py
```

## 2) Build Distributions

From repo root (where `sdk/pyproject.toml` lives):
```
python -m build sdk
```
Artifacts are created in `sdk/dist/`:
- `xr2_sdk-<version>.tar.gz` (sdist)
- `xr2_sdk-<version>-py3-none-any.whl` (wheel)

## 3) Upload to TestPyPI (dry run)

- Create a token on TestPyPI and set environment variables:
```
export TWINE_USERNAME="__token__"
export TWINE_PASSWORD="pypi-AgENdGVzdC5weXBpLm9yZwIk..."
```
- Upload:
```
twine upload --repository-url https://test.pypi.org/legacy/ sdk/dist/*
```
- Install from TestPyPI into a clean venv to verify:
```
python -m venv .venv-test
source .venv-test/bin/activate
pip install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple xr2-sdk
python -c "import xr2_sdk; print('installed ok')"
```

## 4) Publish to PyPI

- Create a PyPI token and export credentials:
```
export TWINE_USERNAME="__token__"
export TWINE_PASSWORD="pypi-AgENdH..."
```
- Upload:
```
twine upload sdk/dist/*
```

## 5) Updating the Library

- Bump version in `sdk/pyproject.toml` under `[project] version`.
- Optionally update `xr2_sdk/config.py` `BASE_URL` to your production endpoint.
- Rebuild and re-upload:
```
rm -rf sdk/dist
python -m build sdk
# test on TestPyPI if desired
# twine upload --repository-url https://test.pypi.org/legacy/ sdk/dist/*
# then publish to PyPI
twine upload sdk/dist/*
```

## 6) Local Installation from Source

- Install directly from the repo for quick testing:
```
pip install -U ./sdk
```

## 7) Troubleshooting

- If version already exists on PyPI, increment `version` and rebuild.
- Ensure `packages` are correctly discovered (package name `xr2_sdk`, directory contains `__init__.py`).
- Verify dependencies in `pyproject.toml` and reinstall build tools if needed: `pip install -U build twine`.
