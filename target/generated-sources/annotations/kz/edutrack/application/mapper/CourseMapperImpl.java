package kz.edutrack.application.mapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import javax.annotation.processing.Generated;
import kz.edutrack.application.dto.CourseDto;
import kz.edutrack.application.dto.CourseModuleDto;
import kz.edutrack.application.dto.MaterialDto;
import kz.edutrack.application.dto.TopicDto;
import kz.edutrack.domain.model.course.Course;
import kz.edutrack.domain.model.course.CourseModule;
import kz.edutrack.domain.model.course.Material;
import kz.edutrack.domain.model.course.MaterialType;
import kz.edutrack.domain.model.course.Topic;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-03T14:39:37+0500",
    comments = "version: 1.6.3, compiler: javac, environment: Java 17.0.18 (Eclipse Adoptium)"
)
@Component
public class CourseMapperImpl implements CourseMapper {

    @Override
    public CourseDto toDto(Course course) {
        if ( course == null ) {
            return null;
        }

        UUID id = null;
        String title = null;
        String description = null;
        UUID teacherId = null;
        boolean published = false;
        List<CourseModuleDto> modules = null;
        Instant createdAt = null;

        id = course.getId();
        title = course.getTitle();
        description = course.getDescription();
        teacherId = course.getTeacherId();
        published = course.isPublished();
        modules = courseModuleListToCourseModuleDtoList( course.getModules() );
        createdAt = course.getCreatedAt();

        CourseDto courseDto = new CourseDto( id, title, description, teacherId, published, modules, createdAt );

        return courseDto;
    }

    @Override
    public CourseModuleDto toDto(CourseModule module) {
        if ( module == null ) {
            return null;
        }

        UUID id = null;
        UUID courseId = null;
        String title = null;
        int orderIndex = 0;
        List<TopicDto> topics = null;

        id = module.getId();
        courseId = module.getCourseId();
        title = module.getTitle();
        orderIndex = module.getOrderIndex();
        topics = topicListToTopicDtoList( module.getTopics() );

        CourseModuleDto courseModuleDto = new CourseModuleDto( id, courseId, title, orderIndex, topics );

        return courseModuleDto;
    }

    @Override
    public TopicDto toDto(Topic topic) {
        if ( topic == null ) {
            return null;
        }

        UUID id = null;
        UUID moduleId = null;
        String title = null;
        String content = null;
        int orderIndex = 0;
        List<MaterialDto> materials = null;

        id = topic.getId();
        moduleId = topic.getModuleId();
        title = topic.getTitle();
        content = topic.getContent();
        orderIndex = topic.getOrderIndex();
        materials = materialListToMaterialDtoList( topic.getMaterials() );

        TopicDto topicDto = new TopicDto( id, moduleId, title, content, orderIndex, materials );

        return topicDto;
    }

    @Override
    public MaterialDto toDto(Material material) {
        if ( material == null ) {
            return null;
        }

        String publicUrl = null;
        UUID id = null;
        UUID topicId = null;
        String fileName = null;
        MaterialType type = null;
        long sizeBytes = 0L;
        Instant uploadedAt = null;

        publicUrl = material.getPublicUrl();
        id = material.getId();
        topicId = material.getTopicId();
        fileName = material.getFileName();
        type = material.getType();
        sizeBytes = material.getSizeBytes();
        uploadedAt = material.getUploadedAt();

        MaterialDto materialDto = new MaterialDto( id, topicId, fileName, publicUrl, type, sizeBytes, uploadedAt );

        return materialDto;
    }

    protected List<CourseModuleDto> courseModuleListToCourseModuleDtoList(List<CourseModule> list) {
        if ( list == null ) {
            return null;
        }

        List<CourseModuleDto> list1 = new ArrayList<CourseModuleDto>( list.size() );
        for ( CourseModule courseModule : list ) {
            list1.add( toDto( courseModule ) );
        }

        return list1;
    }

    protected List<TopicDto> topicListToTopicDtoList(List<Topic> list) {
        if ( list == null ) {
            return null;
        }

        List<TopicDto> list1 = new ArrayList<TopicDto>( list.size() );
        for ( Topic topic : list ) {
            list1.add( toDto( topic ) );
        }

        return list1;
    }

    protected List<MaterialDto> materialListToMaterialDtoList(List<Material> list) {
        if ( list == null ) {
            return null;
        }

        List<MaterialDto> list1 = new ArrayList<MaterialDto>( list.size() );
        for ( Material material : list ) {
            list1.add( toDto( material ) );
        }

        return list1;
    }
}
