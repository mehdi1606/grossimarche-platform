package com.grossimarche.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.Calendar;
import java.util.Date;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;

/**
 * Machine-enforced layered architecture. Because package-by-layer gives no compile-time
 * protection against a controller reaching into a repository, these rules are what keep the
 * structure clean. Break one (e.g. inject a repository into a controller) and the build fails.
 */
@AnalyzeClasses(packages = "com.grossimarche", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule controllers_do_not_access_repositories = noClasses()
            .that().resideInAPackage("..controller..")
            .should().dependOnClassesThat().resideInAPackage("com.grossimarche.repository..");

    @ArchTest
    static final ArchRule controllers_do_not_expose_entities = noClasses()
            .that().resideInAPackage("..controller..")
            .should().dependOnClassesThat().resideInAPackage("com.grossimarche.entity");

    @ArchTest
    static final ArchRule controllers_are_not_transactional = noClasses()
            .that().resideInAPackage("..controller..")
            .should().beAnnotatedWith(Transactional.class);

    @ArchTest
    static final ArchRule services_do_not_depend_on_controllers = noClasses()
            .that().resideInAPackage("..service..")
            .should().dependOnClassesThat().resideInAPackage("..controller..");

    @ArchTest
    static final ArchRule services_do_not_use_servlet_api = noClasses()
            .that().resideInAPackage("..service..")
            .should().dependOnClassesThat().resideInAPackage("jakarta.servlet..");

    @ArchTest
    static final ArchRule repositories_are_accessed_only_by_service_or_security = noClasses()
            .that().resideOutsideOfPackages("com.grossimarche.repository..", "com.grossimarche.service..", "com.grossimarche.security..")
            .should().dependOnClassesThat().resideInAPackage("com.grossimarche.repository..");

    @ArchTest
    static final ArchRule no_field_injection = noFields()
            .should().beAnnotatedWith(Autowired.class)
            .because("use constructor injection everywhere");

    @ArchTest
    static final ArchRule no_legacy_date_api = noClasses()
            .should().dependOnClassesThat().belongToAnyOf(Date.class, Calendar.class)
            .because("use java.time");

    @ArchTest
    static final ArchRule repositories_do_not_depend_on_services = noClasses()
            .that().resideInAPackage("com.grossimarche.repository..")
            .should().dependOnClassesThat().resideInAPackage("..service..");

    @ArchTest
    static final ArchRule mappers_have_no_business_logic_dependency_on_services =
            fields().that().areDeclaredInClassesThat().resideInAPackage("..dto.mapper..")
                    .should().notBeAnnotatedWith(Autowired.class);
}
