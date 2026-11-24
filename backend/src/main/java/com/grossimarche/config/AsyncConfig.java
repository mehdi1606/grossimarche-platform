package com.grossimarche.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Background execution for work that must not hold a request open: sending e-mail, and
 * pushing notifications to phones.
 *
 * Each pool is deliberately small and its queue bounded. An SMTP relay is slow and
 * rate-limited, so more threads would only queue at the relay instead of here, and an
 * unbounded queue would turn a mail outage into a memory leak. When the queue is full the
 * caller runs the task itself, which throttles the producer rather than dropping messages.
 *
 * Push gets its own pool rather than sharing the mail one: the two fail independently, and a
 * jammed SMTP relay must not also stop a phone from ringing.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    public static final String MAIL_EXECUTOR = "mailExecutor";
    public static final String PUSH_EXECUTOR = "pushExecutor";

    /**
     * Firebase answers in a few hundred milliseconds and takes 500 devices per call, so two
     * threads carry a shop's whole customer base without piling up.
     */
    @Bean(PUSH_EXECUTOR)
    public Executor pushExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("push-");
        executor.setRejectedExecutionHandler(
                new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.initialize();
        return executor;
    }

    @Bean(MAIL_EXECUTOR)
    public Executor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("mail-");
        executor.setRejectedExecutionHandler(
                new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        // Let in-flight messages finish on shutdown instead of vanishing mid-send.
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.initialize();
        return executor;
    }
}
