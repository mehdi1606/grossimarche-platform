package com.grossimarche.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Enables {@code @Scheduled} jobs (data-retention purge). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
