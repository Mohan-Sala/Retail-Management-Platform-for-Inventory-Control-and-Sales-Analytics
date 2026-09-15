import logging
import sys

# Centralized Logger setup
logger = logging.getLogger("ShopSenseML")
logger.setLevel(logging.INFO)

# Formatter
formatter = logging.Formatter(
    "[%(asctime)s] [%(levelname)s] [ML-SERVICE] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Stream Handler (Stdout)
stream_handler = logging.StreamHandler(sys.stdout)
stream_handler.setFormatter(formatter)
logger.addHandler(stream_handler)
