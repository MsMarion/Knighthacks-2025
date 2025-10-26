# Cloudflare Tunnel System
# Uses a very simple create new tunnel script and returns with a printed out url  for ease of connection
# created by Dawn Balaschak May 28th, 2025

# important imports
import subprocess
import time
import logging
import re  

#Configures the logging module
# stores in a .log file for regex finding
def setup_logging(log_file="cloudflared_output.log"):
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()  # Also print to console, can remove if you do not want it in the console
        ]
    )

#Starts a cloudflared tunnel and continuously yields its output.
def start_cloudflared_tunnel(port):
    
    command = f"cloudflared tunnel --url http://localhost:{port}"
    logging.info(f"Starting cloudflared tunnel with command: {command}")

    try:
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,  # Decode output as text
            bufsize=1,  # Line-buffered output
        )

        # Continuously read and yield output
        for line in process.stdout:
            yield line.strip()

        # wait for the process to finish and log the return code
        return_code = process.wait()
        logging.info(f"Cloudflared tunnel finished with exit code: {return_code}")

    # Error handling issues
    except FileNotFoundError:
        logging.error("Error: 'cloudflared' command not found. Make sure it's installed and in your system's PATH.")
    except Exception as e:
        logging.error(f"An error occurred while running cloudflared: {e}")

#Starts the cloudflared tunnel, extracts the URL, and prints it.
def monitor_cloudflared_output(port):
    
    #set up log system to records command outputs
    setup_logging()
    #starts the system and make sure if it works
    output_generator = start_cloudflared_tunnel(port)
    tunnel_url = None

    if output_generator:
        logging.info(f"Monitoring cloudflared output for tunnel to localhost:{port}...")
        try:
            for output_line in output_generator:
                logging.info(f"[Cloudflared] {output_line}")
                # use a regex to find the URL
                match = re.search(r"https:\/\/([a-z0-9-]+)\.trycloudflare\.com", output_line)
                if match:
                    tunnel_url = match.group(0)
                    print(f"\nCloudflared Tunnel URL: {tunnel_url}\n")
                    logging.info(f"Found Cloudflared Tunnel URL: {tunnel_url}")
                    # now stores this URL or trigger email/discord bot sending logic for updates
                    # just break out of the loop after finding it
                    break

        except Exception as e:
            logging.error(f"Error while reading cloudflared output: {e}")

    return tunnel_url

# Basiclaly if you are running it as main

if __name__ == "__main__":
    target_port = 8000  # Example port
    tunnel_url = monitor_cloudflared_output(target_port)

    if tunnel_url:
        print("You can now use this URL for your tunnel.")
        # location for bot/email update system
    else:
        print("Failed to retrieve the Cloudflared Tunnel URL.")

    # Your main application logic can continue here or in other threads
    try:
        while True:
            time.sleep(1) # Keep the main thread alive for monitoring (optional)
    except KeyboardInterrupt:
        logging.info("Stopping cloudflared monitoring.")
        # You might need to add code here to terminate the cloudflared process if it's meant to run in the background 