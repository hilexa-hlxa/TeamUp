from sqlalchemy import Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db.base import Base

class ProjectRoleRequirement(Base):
    __tablename__ = "project_required_roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role_name: Mapped[str] = mapped_column(String(64), nullable=False)

    project = relationship("Project", back_populates="role_requirements")
    __table_args__ = (UniqueConstraint("project_id", "role_name", name="uq_project_role"),)
