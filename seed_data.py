#!/usr/bin/env python3
"""
Скрипт для заполнения базы данных тестовыми данными:
- Хакатоны
- Заявки на проекты и хакатоны
"""
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db.session import SessionLocal
from models.user import User
from models.project import Project
from models.hackathon import Hackathon
from models.application import Application
from models.membership import Membership
from models.hackathon_participant import HackathonParticipant

def seed_hackathons(db: Session):
    """Создает тестовые хакатоны"""
    print("🌱 Создание хакатонов...")
    
    # Находим пользователей для создания хакатонов
    users = db.query(User).limit(5).all()
    if not users:
        print("❌ Нет пользователей в базе. Сначала создайте пользователей.")
        return
    
    hackathons_data = [
        {
            "title": "AI Innovation Hackathon 2024",
            "description": "Создайте инновационные решения с использованием искусственного интеллекта. Призы: 50,000₽",
            "start_at": datetime.now() + timedelta(days=7),
            "end_at": datetime.now() + timedelta(days=10),
        },
        {
            "title": "Web Development Challenge",
            "description": "Разработайте современное веб-приложение за 48 часов. Лучшие проекты получат финансирование.",
            "start_at": datetime.now() + timedelta(days=14),
            "end_at": datetime.now() + timedelta(days=16),
        },
        {
            "title": "Blockchain Solutions Hackathon",
            "description": "Создайте решения на основе блокчейн технологий. Призы и возможность сотрудничества с компаниями.",
            "start_at": datetime.now() - timedelta(days=5),
            "end_at": datetime.now() + timedelta(days=2),
        },
        {
            "title": "Mobile App Sprint",
            "description": "Разработайте мобильное приложение за выходные. Призы: 30,000₽ и менторство от экспертов.",
            "start_at": datetime.now() + timedelta(days=21),
            "end_at": datetime.now() + timedelta(days=23),
        },
        {
            "title": "Data Science Marathon",
            "description": "Решите реальные задачи с помощью анализа данных. Призы: 40,000₽ и стажировки.",
            "start_at": datetime.now() + timedelta(days=30),
            "end_at": datetime.now() + timedelta(days=32),
        },
    ]
    
    created = 0
    for hackathon_data in hackathons_data:
        # Проверяем, существует ли уже такой хакатон
        existing = db.query(Hackathon).filter(
            Hackathon.title == hackathon_data["title"]
        ).first()
        
        if existing:
            print(f"  ⏭️  Хакатон '{hackathon_data['title']}' уже существует")
            continue
        
        hackathon = Hackathon(
            **hackathon_data,
            created_by=users[created % len(users)].id
        )
        db.add(hackathon)
        created += 1
    
    db.commit()
    print(f"✅ Создано {created} новых хакатонов")


def seed_applications(db: Session):
    """Создает тестовые заявки на проекты и хакатоны"""
    print("🌱 Создание заявок...")
    
    # Находим студентов
    students = db.query(User).filter(User.role == "student").all()
    if not students:
        print("❌ Нет студентов в базе. Создайте пользователей с ролью 'student'.")
        return
    
    # Находим проекты
    projects = db.query(Project).limit(10).all()
    
    # Находим хакатоны
    hackathons = db.query(Hackathon).limit(5).all()
    
    if not projects and not hackathons:
        print("❌ Нет проектов или хакатонов в базе.")
        return
    
    created = 0
    
    # Заявки на проекты
    for project in projects[:5]:  # Берем первые 5 проектов
        # Создаем заявки от разных студентов
        for i, student in enumerate(students[:3]):  # По 3 заявки на проект
            # Проверяем, не подал ли уже заявку
            existing = db.query(Application).filter(
                Application.type == "project",
                Application.target_id == project.id,
                Application.applicant_id == student.id
            ).first()
            
            if existing:
                continue
            
            statuses = ["pending", "approved", "rejected"]
            application = Application(
                type="project",
                target_id=project.id,
                applicant_id=student.id,
                message=f"Хочу присоединиться к проекту '{project.title}'",
                status=statuses[i % len(statuses)]  # Разные статусы для разнообразия
            )
            db.add(application)
            created += 1
            
            # Если заявка одобрена, создаем membership
            if application.status == "approved":
                existing_membership = db.query(Membership).filter(
                    Membership.project_id == project.id,
                    Membership.user_id == student.id
                ).first()
                
                if not existing_membership:
                    membership = Membership(
                        project_id=project.id,
                        user_id=student.id,
                        role_in_team="developer",
                        status="active",
                        created_at=datetime.now()
                    )
                    db.add(membership)
    
    # Заявки на хакатоны
    for hackathon in hackathons:
        # Создаем заявки от разных студентов
        for i, student in enumerate(students[:4]):  # По 4 заявки на хакатон
            # Проверяем, не подал ли уже заявку
            existing = db.query(Application).filter(
                Application.type == "hackathon",
                Application.target_id == hackathon.id,
                Application.applicant_id == student.id
            ).first()
            
            if existing:
                continue
            
            statuses = ["pending", "approved", "rejected"]
            application = Application(
                type="hackathon",
                target_id=hackathon.id,
                applicant_id=student.id,
                message=f"Хочу участвовать в хакатоне '{hackathon.title}'",
                status=statuses[i % len(statuses)]
            )
            db.add(application)
            created += 1
            
            # Если заявка одобрена, создаем участника хакатона
            if application.status == "approved":
                existing_participant = db.query(HackathonParticipant).filter(
                    HackathonParticipant.hackathon_id == hackathon.id,
                    HackathonParticipant.user_id == student.id
                ).first()
                
                if not existing_participant:
                    participant = HackathonParticipant(
                        hackathon_id=hackathon.id,
                        user_id=student.id
                    )
                    db.add(participant)
    
    db.commit()
    print(f"✅ Создано {created} новых заявок")


def main():
    """Основная функция"""
    print("=" * 60)
    print("🌱 ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ ТЕСТОВЫМИ ДАННЫМИ")
    print("=" * 60)
    
    db: Session = SessionLocal()
    
    try:
        # Проверяем наличие пользователей
        user_count = db.query(User).count()
        if user_count == 0:
            print("❌ В базе нет пользователей. Создайте хотя бы одного пользователя перед запуском seed.")
            print("   Вы можете зарегистрироваться через API или создать пользователя вручную.")
            return
        
        print(f"✅ Найдено {user_count} пользователей")
        
        # Создаем хакатоны
        seed_hackathons(db)
        
        # Создаем заявки
        seed_applications(db)
        
        print("\n" + "=" * 60)
        print("✅ ЗАПОЛНЕНИЕ ЗАВЕРШЕНО")
        print("=" * 60)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()

