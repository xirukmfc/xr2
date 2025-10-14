# Set the public base URL of your deployed xR2 API here.
# Can be overridden by setting XR2_BASE_URL environment variable
import os

BASE_URL = os.getenv("XR2_BASE_URL", "https://xr2.uk")


