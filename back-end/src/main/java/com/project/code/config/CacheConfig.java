package com.project.code.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.TypeIdResolver;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.hibernate.collection.spi.PersistentBag;
import org.hibernate.collection.spi.PersistentList;
import org.hibernate.collection.spi.PersistentSet;
import org.hibernate.collection.spi.PersistentCollection;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis")
public class CacheConfig {

    public static class CustomTypeResolverBuilder extends ObjectMapper.DefaultTypeResolverBuilder {
        public CustomTypeResolverBuilder(ObjectMapper.DefaultTyping typing, PolymorphicTypeValidator ptv) {
            super(typing, ptv);
        }

        @Override
        public TypeIdResolver idResolver(
                com.fasterxml.jackson.databind.cfg.MapperConfig<?> config,
                com.fasterxml.jackson.databind.JavaType baseType,
                PolymorphicTypeValidator subtypeValidator,
                Collection<com.fasterxml.jackson.databind.jsontype.NamedType> subtypes,
                boolean forSerialization, boolean forDeserialization) {
            
            TypeIdResolver delegate = super.idResolver(config, baseType, subtypeValidator, subtypes, forSerialization, forDeserialization);
            
            return new TypeIdResolver() {
                @Override
                public void init(com.fasterxml.jackson.databind.JavaType bt) {
                    delegate.init(bt);
                }

                @Override
                public String idFromValue(Object value) {
                    if (value instanceof PersistentCollection) {
                        if (value instanceof Set) {
                            return HashSet.class.getName();
                        }
                        return ArrayList.class.getName();
                    }
                    return delegate.idFromValue(value);
                }

                @Override
                public String idFromValueAndType(Object value, Class<?> suggestedType) {
                    if (value instanceof PersistentCollection) {
                        if (value instanceof Set) {
                            return HashSet.class.getName();
                        }
                        return ArrayList.class.getName();
                    }
                    return delegate.idFromValueAndType(value, suggestedType);
                }

                @Override
                public String idFromBaseType() {
                    return delegate.idFromBaseType();
                }

                @Override
                public com.fasterxml.jackson.databind.JavaType typeFromId(com.fasterxml.jackson.databind.DatabindContext context, String id) throws IOException {
                    return delegate.typeFromId(context, id);
                }

                @Override
                public String getDescForKnownTypeIds() {
                    return delegate.getDescForKnownTypeIds();
                }

                @Override
                public com.fasterxml.jackson.annotation.JsonTypeInfo.Id getMechanism() {
                    return delegate.getMechanism();
                }
            };
        }
    }

    @Bean
    public RedisCacheConfiguration cacheConfiguration(ObjectMapper objectMapper) {
        ObjectMapper cacheObjectMapper = objectMapper.copy();
        cacheObjectMapper.registerModule(new JavaTimeModule());
        cacheObjectMapper.registerModule(new Hibernate6Module());

        SimpleModule hibernateCollectionModule = new SimpleModule("HibernateCollectionModule");
        hibernateCollectionModule.addSerializer(PersistentBag.class, new JsonSerializer<PersistentBag>() {
            @Override
            public void serialize(PersistentBag value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                if (value.wasInitialized()) {
                    serializers.defaultSerializeValue(new ArrayList<>(value), gen);
                } else {
                    serializers.defaultSerializeValue(new ArrayList<>(), gen);
                }
            }
        });
        hibernateCollectionModule.addSerializer(PersistentList.class, new JsonSerializer<PersistentList>() {
            @Override
            public void serialize(PersistentList value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                if (value.wasInitialized()) {
                    serializers.defaultSerializeValue(new ArrayList<>(value), gen);
                } else {
                    serializers.defaultSerializeValue(new ArrayList<>(), gen);
                }
            }
        });
        hibernateCollectionModule.addSerializer(PersistentSet.class, new JsonSerializer<PersistentSet>() {
            @Override
            public void serialize(PersistentSet value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                if (value.wasInitialized()) {
                    serializers.defaultSerializeValue(new HashSet<>(value), gen);
                } else {
                    serializers.defaultSerializeValue(new HashSet<>(), gen);
                }
            }
        });
        cacheObjectMapper.registerModule(hibernateCollectionModule);

        CustomTypeResolverBuilder typeResolverBuilder = new CustomTypeResolverBuilder(
                ObjectMapper.DefaultTyping.NON_FINAL,
                cacheObjectMapper.getPolymorphicTypeValidator()
        );
        typeResolverBuilder.init(com.fasterxml.jackson.annotation.JsonTypeInfo.Id.CLASS, null);
        typeResolverBuilder.inclusion(com.fasterxml.jackson.annotation.JsonTypeInfo.As.PROPERTY);
        typeResolverBuilder.typeProperty("@class");
        cacheObjectMapper.setDefaultTyping(typeResolverBuilder);

        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(cacheObjectMapper);

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer));
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory, RedisCacheConfiguration cacheConfiguration) {
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        cacheConfigurations.put("products", cacheConfiguration.entryTtl(Duration.ofMinutes(30)));
        cacheConfigurations.put("categories", cacheConfiguration.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("suppliers", cacheConfiguration.entryTtl(Duration.ofHours(1)));
        cacheConfigurations.put("analytics", cacheConfiguration.entryTtl(Duration.ofMinutes(5)));
        cacheConfigurations.put("dashboard", cacheConfiguration.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfiguration)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
