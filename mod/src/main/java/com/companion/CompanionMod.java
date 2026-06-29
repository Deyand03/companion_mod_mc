package com.companion;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main mod entry point — initializes shared/server-side components.
 * This mod is client-side only, so this class is minimal.
 */
public class CompanionMod implements ModInitializer {

    public static final String MOD_ID = "companion";
    public static final String MOD_VERSION = "0.1.0";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("AI Companion Mod initializing (v{})", MOD_VERSION);
    }
}
