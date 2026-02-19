import os
import sys

# Add the current directory to sys.path to import app
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.core.database import engine, Base
from app.models.bot import Bot
# Import other models if they exist in separate files to be safe
from app.core.database import MessageDB, ConversationDB, TenantDB, TenantUsageDB, LeadFormDB, LeadDB, EmailSettingsDB

def recreate_db():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    recreate_db()
