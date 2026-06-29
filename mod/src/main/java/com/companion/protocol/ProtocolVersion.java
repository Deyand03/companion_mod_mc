package com.companion.protocol;

/**
 * WebSocket Protocol version constant.
 * Must match backend PROTOCOL_VERSION.
 */
public final class ProtocolVersion {
    /** Current protocol version. */
    public static final String VERSION = "1.0";

    /** Mod version string. */
    public static final String MOD_VERSION = "0.1.0";

    /** Minecraft version this mod targets. */
    public static final String MINECRAFT_VERSION = "1.21.1";

    private ProtocolVersion() {} // Prevent instantiation
}
