# Practical SOLID Principles Guide for Tapzio

### 1. Single Responsibility Principle (SRP)
- A class, service, or module should have one, and only one, reason to change.
- *Example*: The NFC redirect service resolves tokens to profile URLs; it does not parse user-agent strings or execute geocoding. Those belong in the analytics worker.

### 2. Open/Closed Principle (OCP)
- Software entities should be open for extension, but closed for modification.
- *Example*: New profile sections (e.g. `video`, `catalog`, `upi`) implement a `ProfileSectionRenderer` interface rather than adding another branch to a 500-line `switch` statement.

### 3. Liskov Substitution Principle (LSP)
- Subtypes must be substitutable for their base types without altering system correctness.
- *Example*: `InMemoryRedisMock` and `IORedisClient` both satisfy the `RedisClient` interface; swapping one for the other in unit tests preserves identical behavior.

### 4. Interface Segregation Principle (ISP)
- Clients should not be forced to depend upon interfaces they do not use.
- *Example*: Break down large repositories into focused interfaces (e.g. `CardReader`, `CardClaimer`, `CardLifecycleManager`).

### 5. Dependency Inversion Principle (DIP)
- High-level modules should not depend on low-level modules; both should depend on abstractions.
- *Example*: The auth service depends on an `OtpProvider` interface, allowing console, WhatsApp Cloud API, and MSG91 adapters to be plugged in interchangeably.

