from .auth import router as auth_router
from .rooms import router as rooms_router
from .devices import router as devices_router
from .sensors import router as sensors_router
from .events import router as events_router
from .incidents import router as incidents_router
from .trust import router as trust_router
from .blind_spots import router as blind_spots_router
from .simulator import router as simulator_router
from .responses import router as responses_router
from .reports import router as reports_router
from .system import router as system_router

__all__ = [
    "auth_router", "rooms_router", "devices_router", "sensors_router",
    "events_router", "incidents_router", "trust_router", "blind_spots_router",
    "simulator_router", "responses_router", "reports_router", "system_router"
]
