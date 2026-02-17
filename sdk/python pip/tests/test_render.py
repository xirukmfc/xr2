"""Tests for PromptContentResponse.render() method."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest

from xr2_sdk.models import PromptContentResponse, RenderedPrompt, VariableError


def _make_prompt(**overrides) -> PromptContentResponse:
    """Create a PromptContentResponse with sensible defaults."""
    defaults = {
        "slug": "test-prompt",
        "source_name": "test",
        "version_number": 1,
        "status": "production",
        "system_prompt": None,
        "user_prompt": None,
        "assistant_prompt": None,
        "variables": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "trace_id": "trace_abc123",
    }
    defaults.update(overrides)
    return PromptContentResponse(**defaults)


# --- Basic replacement ---


def test_double_brace_replacement():
    prompt = _make_prompt(
        user_prompt="Hello {{name}}!",
        variables=[{"name": "name", "type": "string", "required": True}],
    )
    rendered = prompt.render({"name": "Alice"})
    assert rendered.user_prompt == "Hello Alice!"


def test_single_brace_backward_compat():
    prompt = _make_prompt(
        user_prompt="Hello {name}!",
        variables=[{"name": "name", "type": "string", "required": True}],
    )
    rendered = prompt.render({"name": "Bob"})
    assert rendered.user_prompt == "Hello Bob!"


def test_mixed_double_and_single_braces():
    prompt = _make_prompt(
        user_prompt="Hi {{name}}, your code is {code}.",
        variables=[
            {"name": "name", "type": "string", "required": True},
            {"name": "code", "type": "string", "required": True},
        ],
    )
    rendered = prompt.render({"name": "Eve", "code": "XYZ"})
    assert rendered.user_prompt == "Hi Eve, your code is XYZ."


# --- Strict mode ---


def test_missing_required_strict_raises():
    prompt = _make_prompt(
        user_prompt="Hello {{name}}!",
        variables=[{"name": "name", "type": "string", "required": True}],
    )
    with pytest.raises(VariableError) as exc_info:
        prompt.render({})
    assert "name" in exc_info.value.missing_variables


def test_missing_required_non_strict_keeps_placeholder():
    prompt = _make_prompt(
        user_prompt="Hello {{name}}!",
        variables=[{"name": "name", "type": "string", "required": True}],
    )
    rendered = prompt.render({}, strict=False)
    assert rendered.user_prompt == "Hello {{name}}!"


# --- Defaults ---


def test_default_value_applied():
    prompt = _make_prompt(
        user_prompt="Hello {{name}}!",
        variables=[{"name": "name", "type": "string", "default": "Guest"}],
    )
    rendered = prompt.render({})
    assert rendered.user_prompt == "Hello Guest!"


def test_default_value_field_name():
    """Frontend sometimes sends 'defaultValue' instead of 'default'."""
    prompt = _make_prompt(
        user_prompt="Hello {{name}}!",
        variables=[{"name": "name", "type": "string", "defaultValue": "Visitor"}],
    )
    rendered = prompt.render({})
    assert rendered.user_prompt == "Hello Visitor!"


def test_provided_value_overrides_default():
    prompt = _make_prompt(
        user_prompt="Hello {{name}}!",
        variables=[{"name": "name", "type": "string", "default": "Guest"}],
    )
    rendered = prompt.render({"name": "Alice"})
    assert rendered.user_prompt == "Hello Alice!"


# --- Type conversions ---


def test_array_renders_as_json():
    prompt = _make_prompt(
        user_prompt="Items: {{items}}",
        variables=[{"name": "items", "type": "array", "required": True}],
    )
    rendered = prompt.render({"items": ["apple", "banana"]})
    assert rendered.user_prompt == 'Items: ["apple", "banana"]'


def test_array_with_separator():
    prompt = _make_prompt(
        user_prompt="Items: {{items}}",
        variables=[{"name": "items", "type": "array", "required": True}],
    )
    rendered = prompt.render({"items": ["apple", "banana"]}, array_separator=", ")
    assert rendered.user_prompt == "Items: apple, banana"


def test_boolean_renders_lowercase():
    prompt = _make_prompt(
        user_prompt="Premium: {{is_premium}}",
        variables=[{"name": "is_premium", "type": "boolean", "required": True}],
    )
    rendered = prompt.render({"is_premium": True})
    assert rendered.user_prompt == "Premium: true"

    rendered2 = prompt.render({"is_premium": False})
    assert rendered2.user_prompt == "Premium: false"


def test_number_renders_as_string():
    prompt = _make_prompt(
        user_prompt="Count: {{count}}",
        variables=[{"name": "count", "type": "number", "required": True}],
    )
    rendered = prompt.render({"count": 42})
    assert rendered.user_prompt == "Count: 42"


# --- Safety ---


def test_json_in_prompt_not_broken():
    """JSON like {"model":"gpt-4"} should be untouched if 'model' is not a declared variable."""
    prompt = _make_prompt(
        user_prompt='Config: {"model": "gpt-4"}, name={{name}}',
        variables=[{"name": "name", "type": "string", "required": True}],
    )
    rendered = prompt.render({"name": "Alice"})
    assert rendered.user_prompt == 'Config: {"model": "gpt-4"}, name=Alice'


def test_unknown_placeholder_stays():
    """Placeholders not in variables[] should remain untouched."""
    prompt = _make_prompt(
        user_prompt="Hello {{name}}, {{unknown_token}}!",
        variables=[{"name": "name", "type": "string", "required": True}],
    )
    rendered = prompt.render({"name": "Alice"})
    assert rendered.user_prompt == "Hello Alice, {{unknown_token}}!"


# --- All prompt fields ---


def test_all_three_prompt_fields_rendered():
    prompt = _make_prompt(
        system_prompt="System: {{role}}",
        user_prompt="User: {{question}}",
        assistant_prompt="Assistant: {{style}}",
        variables=[
            {"name": "role", "type": "string", "required": True},
            {"name": "question", "type": "string", "required": True},
            {"name": "style", "type": "string", "required": True},
        ],
    )
    rendered = prompt.render({"role": "helper", "question": "How?", "style": "brief"})
    assert rendered.system_prompt == "System: helper"
    assert rendered.user_prompt == "User: How?"
    assert rendered.assistant_prompt == "Assistant: brief"


def test_none_prompt_fields_stay_none():
    prompt = _make_prompt(
        system_prompt=None,
        user_prompt="Hello {{name}}!",
        assistant_prompt=None,
        variables=[{"name": "name", "type": "string", "required": True}],
    )
    rendered = prompt.render({"name": "Alice"})
    assert rendered.system_prompt is None
    assert rendered.user_prompt == "Hello Alice!"
    assert rendered.assistant_prompt is None


# --- Result metadata ---


def test_trace_id_preserved():
    prompt = _make_prompt(
        user_prompt="Hi",
        trace_id="trace_xyz789",
    )
    rendered = prompt.render({})
    assert rendered.trace_id == "trace_xyz789"


def test_variables_used_contains_resolved_values():
    prompt = _make_prompt(
        user_prompt="Hello {{name}}, tier={{tier}}",
        variables=[
            {"name": "name", "type": "string", "required": True},
            {"name": "tier", "type": "string", "default": "free"},
        ],
    )
    rendered = prompt.render({"name": "Alice"})
    assert rendered.variables_used == {"name": "Alice", "tier": "free"}


def test_use_defaults_false_skips_defaults():
    prompt = _make_prompt(
        user_prompt="Hello {{name}}!",
        variables=[{"name": "name", "type": "string", "default": "Guest"}],
    )
    rendered = prompt.render({}, use_defaults=False, strict=False)
    assert rendered.user_prompt == "Hello {{name}}!"
    assert "name" not in rendered.variables_used
