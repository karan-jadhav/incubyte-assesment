from backend.config import Settings


def test_settings_loads_values_from_env_file(tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "\n".join(
            [
                "APP_NAME=Salary API",
                "APP_ENVIRONMENT=test",
                "DATABASE_URL=postgresql://user:password@localhost:5432/testdb",
                "APP_DEBUG=true",
            ]
        ),
        encoding="utf-8",
    )

    settings = Settings(_env_file=env_file)

    assert settings.app_name == "Salary API"
    assert settings.environment == "test"
    assert settings.database_url == "postgresql://user:password@localhost:5432/testdb"
    assert settings.debug is True


def test_settings_defaults_to_backend_env_file():
    env_file = Settings.model_config["env_file"]

    assert env_file.name == ".env"
    assert env_file.parent.name == "backend"
