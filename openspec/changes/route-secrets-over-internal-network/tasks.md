## 1. Shared network

- [ ] 1.1 Create the external Docker network `finops-shared` on the VPS
- [ ] 1.2 Attach the backend's compose stack to `finops-shared` in addition to its default network
- [ ] 1.3 Attach the Infisical compose stack to `finops-shared` in addition to its default network

## 2. Switch the resolution path

- [ ] 2.1 Update the backend's Infisical URL configuration to the internal service name (e.g. `http://infisical:8080`)
- [ ] 2.2 Verify the backend can still fetch secrets successfully after the switch
- [ ] 2.3 Confirm Infisical's port no longer needs to be publicly published for backend consumption (web UI access may remain separate)

## 3. Verify

- [ ] 3.1 Confirm (e.g. via a packet capture or by temporarily blocking the public route) that app→Infisical traffic no longer leaves the Docker bridge
