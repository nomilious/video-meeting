from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL, make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent / "../../.env", extra="ignore"
    )

    database_url: str = ""
    db_host: str = "localhost"
    db_password: str | None = None
    jwt_secret: str = Field(min_length=16)
    web_origin: str = "http://localhost:3000"

    @field_validator("jwt_secret")
    @classmethod
    def validate_secret(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("JWT_SECRET must not be blank")

        return value

    @model_validator(mode="after")
    def async_database_url(self) -> "Settings":
        if self.db_password is not None:
            # URL.create safely encodes credentials, including @, /, # and %.
            url = URL.create(
                "postgresql+asyncpg",
                username="video_meetings",
                password=self.db_password,
                host=self.db_host,
                port=5432,
                database="video_meetings",
            )
        elif self.database_url:
            url = make_url(self.database_url)
        else:
            raise ValueError("Set DATABASE_URL or DB_PASSWORD")

        if url.get_backend_name() != "postgresql":
            raise ValueError("DATABASE_URL must use PostgreSQL")

        # Accept the previous Prisma URL; public is PostgreSQL's default schema.
        schema = url.query.get("schema", "public")

        if schema != "public":
            raise ValueError("Only the public schema is supported")

        url = url.set(drivername="postgresql+asyncpg").difference_update_query(["schema"])
        self.database_url = url.render_as_string(hide_password=False)

        return self


settings = Settings()
